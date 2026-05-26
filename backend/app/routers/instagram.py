import asyncio
import httpx
from datetime import date, datetime, timedelta
from dateutil import parser
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.config import META_IG_ID, META_ACCESS_TOKEN, META_BASE_URL
from app.core.secrets import decrypt_secret
from app.database import get_db
from app.dependencies import get_current_user
from app.models import Client, User, UserClientAccess, MetricSnapshot, StoryArchive, AudienceArchive, MediaArchive

router = APIRouter()


def get_client_creds(client_id: Optional[int], current: User, db: Session):
    if client_id:
        c = db.query(Client).filter(Client.id == client_id).first()
        if not c:
            raise HTTPException(status_code=404, detail="Cliente não encontrado")

        if current.role != "admin":
            allowed = (
                db.query(UserClientAccess)
                .filter(UserClientAccess.user_id == current.id, UserClientAccess.client_id == c.id)
                .first()
            )
            if not allowed:
                raise HTTPException(status_code=403, detail="Usuário sem acesso a este cliente")

        return c.ig_id, decrypt_secret(c.access_token)

    if current.role != "admin":
        raise HTTPException(status_code=400, detail="client_id é obrigatório para este perfil")

    return META_IG_ID, META_ACCESS_TOKEN


@router.get("/profile")
async def get_profile(
    client_id: Optional[int] = None,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ig_id, token = get_client_creds(client_id, current, db)
    url = f"{META_BASE_URL}/{ig_id}"
    params = {
        "fields": "id,name,username,followers_count,follows_count,media_count,profile_picture_url,biography",
        "access_token": token,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            return {} # Empty profile
        return r.json()


@router.get("/insights")
async def get_insights(
    client_id: Optional[int] = None,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ig_id, token = get_client_creds(client_id, current, db)
    url = f"{META_BASE_URL}/{ig_id}/insights"
    params = {"metric": "reach,impressions,profile_views,follower_count", "period": "day", "access_token": token}
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            # Silently fallback to empty to avoid crashing the dashboard
            return {"data": []}
        return r.json()


@router.get("/audience")
async def get_audience(
    client_id: Optional[int] = None,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ig_id, token = get_client_creds(client_id, current, db)
    url = f"{META_BASE_URL}/{ig_id}/insights"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Fetch age/gender and city breakdowns in parallel
        params_demographics = {
            "metric": "follower_demographics",
            "period": "lifetime",
            "metric_type": "total_value",
            "breakdown": "age,gender",
            "access_token": token
        }
        params_city = {
            "metric": "follower_demographics",
            "period": "lifetime",
            "metric_type": "total_value",
            "breakdown": "city",
            "access_token": token
        }
        
        res_demo, res_city = await asyncio.gather(
            client.get(url, params=params_demographics),
            client.get(url, params=params_city)
        )
        
        # If both fail with non-200, check if we can fall back to the old metrics
        if res_demo.status_code != 200:
            params_old = {"metric": "audience_gender_age,audience_city", "period": "lifetime", "access_token": token}
            old_res = await client.get(url, params=params_old)
            if old_res.status_code == 200:
                return old_res.json()
            return {"data": []}

        # Convert the new v21.0 follower_demographics to legacy audience schema
        response_data = []
        
        # 1. Map Age/Gender
        try:
            demo_json = res_demo.json()
            demo_breakdowns = demo_json.get("data", [{}])[0].get("total_value", {}).get("breakdowns", [])
            if demo_breakdowns:
                age_gender_val = {}
                results = demo_breakdowns[0].get("results", [])
                for item in results:
                    dims = item.get("dimension_values", [])
                    if len(dims) >= 2:
                        age = dims[0]
                        gender = dims[1]
                        val = item.get("value", 0)
                        age_gender_val[f"{gender}.{age}"] = val
                response_data.append({
                    "name": "audience_gender_age",
                    "values": [{"value": age_gender_val}]
                })
        except Exception as e:
            print("Failed parsing demographics:", e)

        # 2. Map Cities
        try:
            city_json = res_city.json()
            city_breakdowns = city_json.get("data", [{}])[0].get("total_value", {}).get("breakdowns", [])
            if city_breakdowns:
                city_val = {}
                results = city_breakdowns[0].get("results", [])
                for item in results:
                    dims = item.get("dimension_values", [])
                    if len(dims) >= 1:
                        city_name = dims[0]
                        val = item.get("value", 0)
                        city_val[city_name] = val
                response_data.append({
                    "name": "audience_city",
                    "values": [{"value": city_val}]
                })
        except Exception as e:
            print("Failed parsing cities:", e)

        return {"data": response_data}


@router.get("/media")
async def get_media(
    client_id: int | None = None,
    days: int = 30,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ig_id, token = get_client_creds(client_id, current, db)
    
    from datetime import date, timedelta
    from app.models import MediaArchive
    
    # 1. Try to get the latest snapshot from DB to avoid hitting Meta API for every post
    today_snapshots = db.query(MediaArchive).filter(
        MediaArchive.client_id == client_id,
        MediaArchive.snapshot_date == date.today()
    ).all()
    
    # If we have no snapshots today, we fetch them once (this happens only if snapshots/collect failed or hasn't run)
    if not today_snapshots:
        return {"data": []}

    # 2. Fetch past archive for delta calculation
    past_date = date.today() - timedelta(days=days)
    past_archives = db.query(MediaArchive).filter(
        MediaArchive.client_id == client_id,
        MediaArchive.snapshot_date >= past_date
    ).order_by(MediaArchive.snapshot_date.asc()).all()
    
    # Map media by ID
    today_map = {a.media_id: a for a in today_snapshots}
    past_map = {}
    for a in past_archives:
        if a.media_id not in past_map:
            past_map[a.media_id] = a

    items_with_insights = []
    for m_id, today in today_map.items():
        item = {
            "id": today.media_id,
            "caption": today.caption,
            "media_type": today.media_type,
            "permalink": today.permalink,
            "thumbnail_url": today.thumbnail_url,
            "timestamp": today.timestamp.isoformat() if today.timestamp else None,
        }
        
        if m_id in past_map:
            past = past_map[m_id]
            item["like_count"] = max(0, today.like_count - past.like_count)
            item["comments_count"] = max(0, today.comments_count - past.comments_count)
            item["insights"] = {
                "reach": max(0, today.reach - past.reach),
                "impressions": max(0, today.impressions - past.impressions),
                "saved": max(0, today.saved - past.saved),
                "shares": max(0, today.shares - past.shares),
            }
            item["is_delta"] = True
        else:
            item["like_count"] = today.like_count
            item["comments_count"] = today.comments_count
            item["insights"] = {
                "reach": today.reach,
                "impressions": today.impressions,
                "saved": today.saved,
                "shares": today.shares,
            }
            item["is_delta"] = False
        
        items_with_insights.append(item)
        
    # Sort by total interactions in the period (like + comment + saved + share)
    items_with_insights.sort(key=lambda x: (
        x.get("like_count", 0) + 
        x.get("comments_count", 0) + 
        x.get("insights", {}).get("saved", 0) + 
        x.get("insights", {}).get("shares", 0)
    ), reverse=True)
    
    return {"data": items_with_insights}

@router.get("/stories/history")
async def get_stories_history(
    client_id: int | None = None,
    days: int = 30,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    c = db.query(Client).filter(Client.id == client_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
        
    if current.role != "admin":
        allowed = db.query(UserClientAccess).filter(UserClientAccess.user_id == current.id, UserClientAccess.client_id == c.id).first()
        if not allowed:
            raise HTTPException(status_code=403, detail="Usuário sem acesso")
            
    from datetime import date, timedelta
    since = date.today() - timedelta(days=max(days, 1))
    
    rows = (
        db.query(StoryArchive)
        .filter(StoryArchive.client_id == client_id, StoryArchive.timestamp >= since)
        .order_by(StoryArchive.timestamp.desc())
        .all()
    )
    
    return {"data": [{
        "story_id": r.story_id,
        "media_url": r.media_url,
        "timestamp": r.timestamp.isoformat(),
        "reach": r.reach,
        "impressions": r.impressions,
        "replies": r.replies,
        "shares": r.shares,
        "profile_visits": r.profile_visits,
        "taps_forward": r.taps_forward,
        "taps_back": r.taps_back,
        "exits": r.exits
    } for r in rows]}

async def collect_audience_archive(client_id: int, current: User, db: Session):
    ig_id, token = get_client_creds(client_id, current, db)
    url = f"{META_BASE_URL}/{ig_id}/insights"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        params_demographics = {
            "metric": "follower_demographics",
            "period": "lifetime",
            "metric_type": "total_value",
            "breakdown": "age,gender",
            "access_token": token
        }
        params_city = {
            "metric": "follower_demographics",
            "period": "lifetime",
            "metric_type": "total_value",
            "breakdown": "city",
            "access_token": token
        }
        
        res_demo, res_city = await asyncio.gather(
            client.get(url, params=params_demographics),
            client.get(url, params=params_city)
        )
        
        age_gender = None
        city = None
        
        if res_demo.status_code == 200:
            try:
                demo_json = res_demo.json()
                demo_breakdowns = demo_json.get("data", [{}])[0].get("total_value", {}).get("breakdowns", [])
                if demo_breakdowns:
                    age_gender = {}
                    results = demo_breakdowns[0].get("results", [])
                    for item in results:
                        dims = item.get("dimension_values", [])
                        if len(dims) >= 2:
                            age = dims[0]
                            gender = dims[1]
                            val = item.get("value", 0)
                            age_gender[f"{gender}.{age}"] = val
            except Exception as e:
                print("Failed parsing collect demographics:", e)

        if res_city.status_code == 200:
            try:
                city_json = res_city.json()
                city_breakdowns = city_json.get("data", [{}])[0].get("total_value", {}).get("breakdowns", [])
                if city_breakdowns:
                    city = {}
                    results = city_breakdowns[0].get("results", [])
                    for item in results:
                        dims = item.get("dimension_values", [])
                        if len(dims) >= 1:
                            city_name = dims[0]
                            val = item.get("value", 0)
                            city[city_name] = val
            except Exception as e:
                print("Failed parsing collect cities:", e)

        # Fallback to old format if new demographics are empty
        if not age_gender and not city:
            params_old = {"metric": "audience_gender_age,audience_city", "period": "lifetime", "access_token": token}
            old_res = await client.get(url, params=params_old)
            if old_res.status_code == 200:
                data = old_res.json().get("data", [])
                age_gender = next((m["values"][0]["value"] for m in data if m["name"] == "audience_gender_age" and m.get("values")), None)
                city = next((m["values"][0]["value"] for m in data if m["name"] == "audience_city" and m.get("values")), None)

        if age_gender or city:
            import json
            from datetime import date
            from app.models import AudienceArchive
            
            exists = db.query(AudienceArchive).filter(
                AudienceArchive.client_id == client_id, AudienceArchive.snapshot_date == date.today()
            ).first()
            if exists:
                if age_gender:
                    exists.gender_age_json = json.dumps(age_gender)
                if city:
                    exists.city_json = json.dumps(city)
            else:
                db.add(AudienceArchive(
                    client_id=client_id, snapshot_date=date.today(),
                    gender_age_json=json.dumps(age_gender) if age_gender else None,
                    city_json=json.dumps(city) if city else None
                ))
            db.commit()

async def collect_media_archive(client_id: int, current: User, db: Session):
    import asyncio
    ig_id, token = get_client_creds(client_id, current, db)
    url = f"{META_BASE_URL}/{ig_id}/media"
    params = {
        "fields": "id,caption,media_type,thumbnail_url,permalink,timestamp,like_count,comments_count",
        "limit": 50, # Archive recent 50 posts every day
        "access_token": token,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, params=params)
        if r.status_code != 200: return
        items = r.json().get("data", [])
        
        async def fetch_insights_and_save(item):
            media_id = item["id"]
            media_type = item.get("media_type")
            
            # Define metrics to try
            metrics_to_try = ["reach", "saved"]
            if media_type != "VIDEO":
                metrics_to_try.append("impressions")
            else:
                # For videos/reels, sometimes video_views or plays work, but reach is safer
                metrics_to_try.append("video_views")

            insights_dict = {}
            # Try to fetch all requested metrics
            resp = await client.get(f"{META_BASE_URL}/{media_id}/insights", params={"metric": ",".join(metrics_to_try), "access_token": token})
            
            if resp.status_code != 200:
                # If failed, try only the most basic ones
                resp = await client.get(f"{META_BASE_URL}/{media_id}/insights", params={"metric": "reach,saved", "access_token": token})
            
            if resp.status_code == 200:
                insights_data = resp.json().get("data", [])
                insights_dict = {i["name"]: i["values"][0]["value"] for i in insights_data if i.get("values")}
                
            from datetime import date
            from dateutil import parser
            from app.models import MediaArchive
            
            exists = db.query(MediaArchive).filter(
                MediaArchive.client_id == client_id, MediaArchive.media_id == media_id, MediaArchive.snapshot_date == date.today()
            ).first()
            
            ts = parser.parse(item.get("timestamp")) if item.get("timestamp") else None
            if exists:
                exists.like_count = item.get("like_count", 0)
                exists.comments_count = item.get("comments_count", 0)
                exists.reach = insights_dict.get("reach", 0)
                exists.impressions = insights_dict.get("impressions") or insights_dict.get("video_views") or 0
                exists.saved = insights_dict.get("saved", 0)
                exists.shares = insights_dict.get("shares", 0)
            else:
                db.add(MediaArchive(
                    client_id=client_id, media_id=media_id, snapshot_date=date.today(),
                    caption=item.get("caption"), media_type=item.get("media_type"),
                    permalink=item.get("permalink"), thumbnail_url=item.get("thumbnail_url"), timestamp=ts,
                    like_count=item.get("like_count", 0), comments_count=item.get("comments_count", 0),
                    reach=insights_dict.get("reach", 0), 
                    impressions=insights_dict.get("impressions") or insights_dict.get("video_views") or 0,
                    saved=insights_dict.get("saved", 0), shares=insights_dict.get("shares", 0), plays=0
                ))
                
        await asyncio.gather(*[fetch_insights_and_save(i) for i in items])
        db.commit()

