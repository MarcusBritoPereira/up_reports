from datetime import datetime, timedelta
import httpx
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Client
from app.config import META_IG_ID, META_ACCESS_TOKEN, META_BASE_URL

router = APIRouter()


def get_client_creds(client_id: int | None, db: Session):
    if client_id:
        c = db.query(Client).filter(Client.id == client_id).first()
        if not c:
            raise HTTPException(status_code=404, detail="Cliente não encontrado")
        return c.ig_id, c.access_token
    return META_IG_ID, META_ACCESS_TOKEN


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


@router.get("/profile")
async def get_profile(client_id: int | None = None, db: Session = Depends(get_db)):
    ig_id, token = get_client_creds(client_id, db)
    url = f"{META_BASE_URL}/{ig_id}"
    params = {
        "fields": "id,name,username,followers_count,follows_count,media_count,profile_picture_url,biography",
        "access_token": token,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.json())
        return r.json()


@router.get("/insights")
async def get_insights(client_id: int | None = None, db: Session = Depends(get_db)):
    ig_id, token = get_client_creds(client_id, db)
    url = f"{META_BASE_URL}/{ig_id}/insights"
    params = {
        "metric": "reach,impressions,profile_views,follower_count",
        "period": "day",
        "access_token": token,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.json())
        return r.json()


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
