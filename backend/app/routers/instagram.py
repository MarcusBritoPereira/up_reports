<<<<<<< HEAD
import asyncio
=======
from datetime import datetime, timedelta
>>>>>>> pr-2
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
from app.models import Client, User, UserClientAccess

router = APIRouter()


<<<<<<< HEAD
def get_client_creds(client_id: Optional[int], current: User, db: Session):
=======
def get_client_creds(client_id: int | None, db: Session):
>>>>>>> pr-2
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


<<<<<<< HEAD
=======
def build_daily_series(insights_data):
    series_by_day = {}

    for metric in insights_data:
        name = metric.get("name")
        for point in metric.get("values", []):
            day = point.get("end_time", "")[:10]
            if day not in series_by_day:
                series_by_day[day] = {
                    "day": day,
                    "reach": 0,
                    "impressions": 0,
                    "profile_views": 0,
                    "follower_count": 0,
                }
            value = point.get("value")
            if isinstance(value, (int, float)):
                series_by_day[day][name] = value

    return sorted(series_by_day.values(), key=lambda x: x["day"])


>>>>>>> pr-2
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
<<<<<<< HEAD
    async with httpx.AsyncClient() as client:
=======
    async with httpx.AsyncClient(timeout=30.0) as client:
>>>>>>> pr-2
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
    params = {
        "metric": "reach,impressions,profile_views,follower_count",
        "period": "day",
        "access_token": token,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            # Silently fallback to empty to avoid crashing the dashboard
            return {"data": []}
        return r.json()


<<<<<<< HEAD
@router.get("/audience")
async def get_audience(
    client_id: Optional[int] = None,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ig_id, token = get_client_creds(client_id, current, db)
    url = f"{META_BASE_URL}/{ig_id}/insights"
    params = {"metric": "audience_gender_age,audience_city", "period": "lifetime", "access_token": token}
    async with httpx.AsyncClient() as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            # Silently fallback to empty to avoid crashing the dashboard
            return {"data": []}
        return r.json()


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
    params = {"metric": "audience_gender_age,audience_city", "period": "lifetime", "access_token": token}
    async with httpx.AsyncClient() as client:
        r = await client.get(url, params=params)
        if r.status_code == 200:
            import json
            from datetime import date
            from app.models import AudienceArchive
            data = r.json().get("data", [])
            age_gender = next((m["values"][0]["value"] for m in data if m["name"] == "audience_gender_age" and m.get("values")), None)
            city = next((m["values"][0]["value"] for m in data if m["name"] == "audience_city" and m.get("values")), None)
            
            exists = db.query(AudienceArchive).filter(
                AudienceArchive.client_id == client_id, AudienceArchive.snapshot_date == date.today()
            ).first()
            if exists:
                exists.gender_age_json = json.dumps(age_gender) if age_gender else None
                exists.city_json = json.dumps(city) if city else None
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
    async with httpx.AsyncClient() as client:
        r = await client.get(url, params=params)
        if r.status_code != 200: return
        items = r.json().get("data", [])
        
        async def fetch_insights_and_save(item):
            media_id = item["id"]
            metric = "reach,saved,impressions" 
            if item.get("media_type") == "VIDEO":
                metric = "reach,saved,shares,plays"
                
            # Use a safer metric list to avoid 400 errors from deprecated/unsupported metrics
            safe_metric = "reach,saved,impressions"
            if item.get("media_type") == "VIDEO":
                safe_metric = "reach,saved,shares" # Removed "plays" as it causes 400 on newer API versions
            
            resp = await client.get(f"{META_BASE_URL}/{media_id}/insights", params={"metric": safe_metric, "access_token": token})
            insights_dict = {}
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
                exists.impressions = insights_dict.get("impressions", 0)
                exists.saved = insights_dict.get("saved", 0)
                exists.shares = insights_dict.get("shares", 0)
                exists.plays = insights_dict.get("plays", 0)
            else:
                db.add(MediaArchive(
                    client_id=client_id, media_id=media_id, snapshot_date=date.today(),
                    caption=item.get("caption"), media_type=item.get("media_type"),
                    permalink=item.get("permalink"), thumbnail_url=item.get("thumbnail_url"), timestamp=ts,
                    like_count=item.get("like_count", 0), comments_count=item.get("comments_count", 0),
                    reach=insights_dict.get("reach", 0), impressions=insights_dict.get("impressions", 0),
                    saved=insights_dict.get("saved", 0), shares=insights_dict.get("shares", 0), plays=insights_dict.get("plays", 0)
                ))
                
        await asyncio.gather(*[fetch_insights_and_save(i) for i in items])
        db.commit()

=======
@router.get("/media")
async def get_media(client_id: int | None = None, db: Session = Depends(get_db)):
    ig_id, token = get_client_creds(client_id, db)
    url = f"{META_BASE_URL}/{ig_id}/media"
    params = {
        "fields": "id,caption,media_type,thumbnail_url,media_url,permalink,timestamp,like_count,comments_count",
        "limit": 20,
        "access_token": token,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.json())
        return r.json()


@router.get("/report")
async def get_organic_report(
    client_id: int | None = None,
    days: int = 30,
    db: Session = Depends(get_db),
):
    if days not in (7, 14, 30, 90):
        raise HTTPException(status_code=400, detail="days deve ser 7, 14, 30 ou 90")

    ig_id, token = get_client_creds(client_id, db)

    profile_url = f"{META_BASE_URL}/{ig_id}"
    insights_url = f"{META_BASE_URL}/{ig_id}/insights"
    media_url = f"{META_BASE_URL}/{ig_id}/media"

    profile_params = {
        "fields": "id,name,username,followers_count,follows_count,media_count,profile_picture_url,biography",
        "access_token": token,
    }
    since = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
    until = datetime.utcnow().strftime("%Y-%m-%d")
    insights_params = {
        "metric": "reach,impressions,profile_views,follower_count",
        "period": "day",
        "since": since,
        "until": until,
        "access_token": token,
    }
    media_params = {
        "fields": "id,caption,media_type,thumbnail_url,media_url,permalink,timestamp,like_count,comments_count",
        "limit": 20,
        "access_token": token,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        profile_req = client.get(profile_url, params=profile_params)
        insights_req = client.get(insights_url, params=insights_params)
        media_req = client.get(media_url, params=media_params)
        profile_res, insights_res, media_res = await profile_req, await insights_req, await media_req

    if profile_res.status_code != 200:
        raise HTTPException(status_code=profile_res.status_code, detail=profile_res.json())
    if insights_res.status_code != 200:
        raise HTTPException(status_code=insights_res.status_code, detail=insights_res.json())
    if media_res.status_code != 200:
        raise HTTPException(status_code=media_res.status_code, detail=media_res.json())

    profile = profile_res.json()
    insights_data = insights_res.json().get("data", [])
    media = media_res.json().get("data", [])

    daily = build_daily_series(insights_data)

    totals = {
        "reach": sum(item.get("reach", 0) for item in daily),
        "impressions": sum(item.get("impressions", 0) for item in daily),
        "profile_views": sum(item.get("profile_views", 0) for item in daily),
    }

    top_posts = []
    for post in media:
        likes = int(post.get("like_count") or 0)
        comments = int(post.get("comments_count") or 0)
        engagement = likes + comments
        top_posts.append(
            {
                "id": post.get("id"),
                "media_type": post.get("media_type"),
                "thumbnail_url": post.get("thumbnail_url") or post.get("media_url"),
                "permalink": post.get("permalink"),
                "timestamp": post.get("timestamp"),
                "likes": likes,
                "comments": comments,
                "engagement": engagement,
                "caption": post.get("caption"),
            }
        )

    top_posts.sort(key=lambda x: x["engagement"], reverse=True)

    return {
        "period_days": days,
        "profile": profile,
        "summary": {
            "followers_count": profile.get("followers_count", 0),
            "follows_count": profile.get("follows_count", 0),
            "media_count": profile.get("media_count", 0),
            "reach": totals["reach"],
            "impressions": totals["impressions"],
            "profile_views": totals["profile_views"],
            "avg_reach_per_day": round(totals["reach"] / len(daily), 2) if daily else 0,
            "avg_impressions_per_day": round(totals["impressions"] / len(daily), 2) if daily else 0,
        },
        "daily": daily,
        "top_posts": top_posts[:10],
    }
>>>>>>> pr-2
