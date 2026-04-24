import secrets
from datetime import datetime
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.secrets import encrypt_secret
from app.database import get_db
from app.dependencies import require_roles
from app.models import Client, User

router = APIRouter()

_STATE_STORE: dict[str, dict] = {}


@router.get("/meta/start")
def start_meta_oauth(
    provider: str = Query(pattern="^(facebook|instagram)$"),
    client_name: str = Query(min_length=2, max_length=120),
    current: User = Depends(require_roles("admin")),
):
    if not settings.meta_app_id or not settings.meta_oauth_redirect_uri:
        raise HTTPException(status_code=500, detail="META_APP_ID ou META_OAUTH_REDIRECT_URI não configurado")

    state = secrets.token_urlsafe(24)
    _STATE_STORE[state] = {
        "provider": provider,
        "client_name": client_name,
        "user_id": current.id,
        "created_at": datetime.utcnow().isoformat(),
    }

    scope = "public_profile,pages_show_list,pages_read_engagement,ads_read,business_management,instagram_basic,instagram_manage_insights"
    params = {
        "client_id": settings.meta_app_id,
        "redirect_uri": settings.meta_oauth_redirect_uri,
        "state": state,
        "response_type": "code",
        "scope": scope,
    }
    auth_url = f"https://www.facebook.com/v21.0/dialog/oauth?{urlencode(params)}"
    return {"auth_url": auth_url}


@router.get("/meta/callback")
async def meta_oauth_callback(code: str, state: str, db: Session = Depends(get_db)):
    if state not in _STATE_STORE:
        raise HTTPException(status_code=400, detail="state inválido ou expirado")

    state_data = _STATE_STORE.pop(state)

    if not settings.meta_app_id or not settings.meta_app_secret or not settings.meta_oauth_redirect_uri:
        raise HTTPException(status_code=500, detail="Configuração OAuth Meta incompleta")

    async with httpx.AsyncClient(timeout=30) as client:
        token_resp = await client.get(
            f"{settings.meta_base_url}/oauth/access_token",
            params={
                "client_id": settings.meta_app_id,
                "client_secret": settings.meta_app_secret,
                "redirect_uri": settings.meta_oauth_redirect_uri,
                "code": code,
            },
        )

        if token_resp.status_code != 200:
            return RedirectResponse(f"{settings.frontend_url}?oauth_status=error")

        short_token = token_resp.json().get("access_token")
        if not short_token:
            return RedirectResponse(f"{settings.frontend_url}?oauth_status=error")

        long_resp = await client.get(
            f"{settings.meta_base_url}/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": settings.meta_app_id,
                "client_secret": settings.meta_app_secret,
                "fb_exchange_token": short_token,
            },
        )
        token = long_resp.json().get("access_token") if long_resp.status_code == 200 else short_token

        pages_resp = await client.get(
            f"{settings.meta_base_url}/me/accounts",
            params={
                "fields": "id,name,instagram_business_account{id,username}",
                "access_token": token,
            },
        )

        if pages_resp.status_code != 200:
            return RedirectResponse(f"{settings.frontend_url}?oauth_status=error")

        pages = pages_resp.json().get("data", [])
        if not pages:
            return RedirectResponse(f"{settings.frontend_url}?oauth_status=error_no_pages")

        selected = pages[0]
        for page in pages:
            if page.get("instagram_business_account"):
                selected = page
                break

        ig_account = selected.get("instagram_business_account")
        if not ig_account:
            return RedirectResponse(f"{settings.frontend_url}?oauth_status=error_no_instagram")

        existing = db.query(Client).filter(Client.page_id == selected["id"]).first()
        if existing:
            existing.name = state_data["client_name"] or selected.get("name") or existing.name
            existing.ig_id = ig_account["id"]
            existing.access_token = encrypt_secret(token)
            db.commit()
        else:
            client_row = Client(
                name=state_data["client_name"] or selected.get("name") or "Cliente Meta",
                page_id=selected["id"],
                ig_id=ig_account["id"],
                access_token=encrypt_secret(token),
            )
            db.add(client_row)
            db.commit()

    return RedirectResponse(f"{settings.frontend_url}?oauth_status=success")
