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

@router.get("/profile")
async def get_profile(client_id: int | None = None, db: Session = Depends(get_db)):
    ig_id, token = get_client_creds(client_id, db)
    url = f"{META_BASE_URL}/{ig_id}"
    params = {"fields": "id,name,username,followers_count,follows_count,media_count,profile_picture_url,biography", "access_token": token}
    async with httpx.AsyncClient() as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.json())
        return r.json()

@router.get("/insights")
async def get_insights(client_id: int | None = None, db: Session = Depends(get_db)):
    ig_id, token = get_client_creds(client_id, db)
    url = f"{META_BASE_URL}/{ig_id}/insights"
    params = {"metric": "reach,impressions,profile_views,follower_count", "period": "day", "access_token": token}
    async with httpx.AsyncClient() as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.json())
        return r.json()

@router.get("/media")
async def get_media(client_id: int | None = None, db: Session = Depends(get_db)):
    ig_id, token = get_client_creds(client_id, db)
    url = f"{META_BASE_URL}/{ig_id}/media"
    params = {"fields": "id,caption,media_type,thumbnail_url,permalink,timestamp,like_count,comments_count", "limit": 12, "access_token": token}
    async with httpx.AsyncClient() as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.json())
        return r.json()