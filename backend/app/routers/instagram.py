import httpx
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.config import META_IG_ID, META_ACCESS_TOKEN, META_BASE_URL
from app.database import get_db
from app.dependencies import get_current_user
from app.models import Client, User, UserClientAccess

router = APIRouter()


def get_client_creds(client_id: int | None, current: User, db: Session):
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

        return c.ig_id, c.access_token

    if current.role != "admin":
        raise HTTPException(status_code=400, detail="client_id é obrigatório para este perfil")

    return META_IG_ID, META_ACCESS_TOKEN


@router.get("/profile")
async def get_profile(
    client_id: int | None = None,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ig_id, token = get_client_creds(client_id, current, db)
    url = f"{META_BASE_URL}/{ig_id}"
    params = {
        "fields": "id,name,username,followers_count,follows_count,media_count,profile_picture_url,biography",
        "access_token": token,
    }
    async with httpx.AsyncClient() as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.json())
        return r.json()


@router.get("/insights")
async def get_insights(
    client_id: int | None = None,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ig_id, token = get_client_creds(client_id, current, db)
    url = f"{META_BASE_URL}/{ig_id}/insights"
    params = {"metric": "reach,impressions,profile_views,follower_count", "period": "day", "access_token": token}
    async with httpx.AsyncClient() as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.json())
        return r.json()


@router.get("/media")
async def get_media(
    client_id: int | None = None,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ig_id, token = get_client_creds(client_id, current, db)
    url = f"{META_BASE_URL}/{ig_id}/media"
    params = {
        "fields": "id,caption,media_type,thumbnail_url,permalink,timestamp,like_count,comments_count",
        "limit": 12,
        "access_token": token,
    }
    async with httpx.AsyncClient() as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.json())
        return r.json()
