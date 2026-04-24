import secrets
from datetime import datetime
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.secrets import encrypt_secret
from app.database import get_db
from app.dependencies import require_roles
from app.models import Client, User, UserClientAccess

router = APIRouter()

_STATE_STORE: dict[str, dict] = {}
_PENDING_STORE: dict[str, dict] = {}


class CompleteOAuthRequest(BaseModel):
    oauth_session: str
    page_id: str


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
async def meta_oauth_callback(code: str, state: str):
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

        valid_pages = [p for p in pages if p.get("instagram_business_account")]
        if not valid_pages:
            return RedirectResponse(f"{settings.frontend_url}?oauth_status=error_no_instagram")

        oauth_session = secrets.token_urlsafe(24)
        _PENDING_STORE[oauth_session] = {
            "state_data": state_data,
            "token": token,
            "pages": valid_pages,
            "created_at": datetime.utcnow().isoformat(),
        }

    if len(valid_pages) == 1:
        only_page = valid_pages[0]
        return RedirectResponse(
            f"{settings.frontend_url}?oauth_status=select&oauth_session={oauth_session}&auto_page_id={only_page['id']}"
        )

    return RedirectResponse(f"{settings.frontend_url}?oauth_status=select&oauth_session={oauth_session}")


@router.get("/meta/pending/{oauth_session}")
def get_oauth_pending(oauth_session: str, current: User = Depends(require_roles("admin"))):
    pending = _PENDING_STORE.get(oauth_session)
    if not pending:
        raise HTTPException(status_code=404, detail="Sessão OAuth não encontrada")

    if pending["state_data"]["user_id"] != current.id:
        raise HTTPException(status_code=403, detail="Sessão OAuth pertence a outro usuário")

    pages = [
        {
            "page_id": page.get("id"),
            "page_name": page.get("name"),
            "ig_id": page.get("instagram_business_account", {}).get("id"),
            "ig_username": page.get("instagram_business_account", {}).get("username"),
        }
        for page in pending["pages"]
    ]

    return {
        "oauth_session": oauth_session,
        "client_name": pending["state_data"].get("client_name"),
        "pages": pages,
    }


@router.post("/meta/complete")
def complete_meta_oauth(
    data: CompleteOAuthRequest,
    current: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    pending = _PENDING_STORE.pop(data.oauth_session, None)
    if not pending:
        raise HTTPException(status_code=404, detail="Sessão OAuth não encontrada")

    if pending["state_data"]["user_id"] != current.id:
        raise HTTPException(status_code=403, detail="Sessão OAuth pertence a outro usuário")

    selected = None
    for page in pending["pages"]:
        if page.get("id") == data.page_id:
            selected = page
            break

    if not selected:
        raise HTTPException(status_code=404, detail="Página selecionada não encontrada")

    ig_account = selected.get("instagram_business_account")
    if not ig_account:
        raise HTTPException(status_code=400, detail="Página sem Instagram Business vinculado")

    token = pending["token"]
    client_name = pending["state_data"].get("client_name") or selected.get("name") or "Cliente Meta"

    existing = db.query(Client).filter(Client.page_id == selected["id"]).first()
    if existing:
        existing.name = client_name
        existing.ig_id = ig_account["id"]
        existing.access_token = encrypt_secret(token)
        db.commit()
        db.refresh(existing)
        client_row = existing
    else:
        client_row = Client(
            name=client_name,
            page_id=selected["id"],
            ig_id=ig_account["id"],
            access_token=encrypt_secret(token),
        )
        db.add(client_row)
        db.commit()
        db.refresh(client_row)

    access = (
        db.query(UserClientAccess)
        .filter(UserClientAccess.user_id == current.id, UserClientAccess.client_id == client_row.id)
        .first()
    )
    if not access:
        db.add(UserClientAccess(user_id=current.id, client_id=client_row.id))
        db.commit()

    return {"ok": True, "client_id": client_row.id, "client_name": client_row.name}
