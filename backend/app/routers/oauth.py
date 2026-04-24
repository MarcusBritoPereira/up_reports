import json
import secrets
from datetime import datetime, timedelta
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.secrets import decrypt_secret, encrypt_secret
from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models import Client, OAuthSession, User, UserClientAccess

router = APIRouter()


class CompleteOAuthRequest(BaseModel):
    oauth_session: str
    page_id: str
    ad_account_id: str | None = None


def _cleanup_expired_sessions(db: Session) -> None:
    now = datetime.utcnow()
    db.query(OAuthSession).filter(OAuthSession.expires_at < now).delete()
    db.commit()


@router.get("/meta/start")
def start_meta_oauth(
    provider: str = Query(pattern="^(facebook|instagram)$"),
    client_name: str = Query(min_length=2, max_length=120),
    current: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    _cleanup_expired_sessions(db)

    if not settings.meta_app_id or not settings.meta_oauth_redirect_uri:
        raise HTTPException(status_code=500, detail="META_APP_ID ou META_OAUTH_REDIRECT_URI não configurado")

    state = secrets.token_urlsafe(24)
    db.add(
        OAuthSession(
            state=state,
            user_id=current.id,
            provider=provider,
            client_name=client_name,
            status="started",
            expires_at=datetime.utcnow() + timedelta(seconds=settings.oauth_session_ttl_seconds),
        )
    )
    db.commit()

    scope = "public_profile,pages_show_list,pages_read_engagement,pages_read_user_content,ads_read,business_management,instagram_basic,instagram_manage_insights"
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
    _cleanup_expired_sessions(db)

    oauth_row = db.query(OAuthSession).filter(OAuthSession.state == state).first()
    if not oauth_row:
        raise HTTPException(status_code=400, detail="state inválido ou expirado")

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
            oauth_row.status = "failed"
            db.commit()
            return RedirectResponse(f"{settings.frontend_url}?oauth_status=error")

        short_token = token_resp.json().get("access_token")
        if not short_token:
            oauth_row.status = "failed"
            db.commit()
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
                "fields": "id,name,access_token,instagram_business_account{id,username}",
                "access_token": token,
            },
        )

        if pages_resp.status_code != 200:
            oauth_row.status = "failed"
            db.commit()
            return RedirectResponse(f"{settings.frontend_url}?oauth_status=error")

        pages = pages_resp.json().get("data", [])
        valid_pages = []
        for page in pages:
            if not page.get("instagram_business_account"):
                continue
            page_token = page.get("access_token") or token
            ad_resp = await client.get(
                f"{settings.meta_base_url}/{page.get('id')}/owned_ad_accounts",
                params={"fields": "id,name,account_status", "access_token": page_token},
            )
            ad_accounts = ad_resp.json().get("data", []) if ad_resp.status_code == 200 else []
            valid_pages.append(
                {
                    "id": page.get("id"),
                    "name": page.get("name"),
                    "ig": page.get("instagram_business_account"),
                    "ad_accounts": ad_accounts,
                }
            )

    if not valid_pages:
        oauth_row.status = "failed"
        db.commit()
        return RedirectResponse(f"{settings.frontend_url}?oauth_status=error_no_instagram")

    oauth_session = secrets.token_urlsafe(24)
    oauth_row.oauth_session = oauth_session
    oauth_row.token_encrypted = encrypt_secret(token)
    oauth_row.pages_json = json.dumps(valid_pages, ensure_ascii=False)
    oauth_row.status = "pending_selection"
    db.commit()

    if len(valid_pages) == 1:
        auto_page = valid_pages[0]
        auto_ad = auto_page.get("ad_accounts", [{}])[0].get("id") if auto_page.get("ad_accounts") else ""
        return RedirectResponse(
            f"{settings.frontend_url}?oauth_status=select&oauth_session={oauth_session}&auto_page_id={auto_page['id']}&auto_ad_account_id={auto_ad}"
        )

    return RedirectResponse(f"{settings.frontend_url}?oauth_status=select&oauth_session={oauth_session}")


@router.get("/meta/pending/{oauth_session}")
def get_oauth_pending(oauth_session: str, current: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    _cleanup_expired_sessions(db)

    pending = (
        db.query(OAuthSession)
        .filter(OAuthSession.oauth_session == oauth_session, OAuthSession.status == "pending_selection")
        .first()
    )
    if not pending:
        raise HTTPException(status_code=404, detail="Sessão OAuth não encontrada")

    if pending.user_id != current.id:
        raise HTTPException(status_code=403, detail="Sessão OAuth pertence a outro usuário")

    pages = json.loads(pending.pages_json or "[]")
    return {
        "oauth_session": oauth_session,
        "client_name": pending.client_name,
        "pages": [
            {
                "page_id": p.get("id"),
                "page_name": p.get("name"),
                "ig_id": p.get("ig", {}).get("id"),
                "ig_username": p.get("ig", {}).get("username"),
                "ad_accounts": p.get("ad_accounts", []),
            }
            for p in pages
        ],
    }


@router.post("/meta/complete")
def complete_meta_oauth(
    data: CompleteOAuthRequest,
    current: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    _cleanup_expired_sessions(db)

    pending = (
        db.query(OAuthSession)
        .filter(OAuthSession.oauth_session == data.oauth_session, OAuthSession.status == "pending_selection")
        .first()
    )
    if not pending:
        raise HTTPException(status_code=404, detail="Sessão OAuth não encontrada")
    if pending.user_id != current.id:
        raise HTTPException(status_code=403, detail="Sessão OAuth pertence a outro usuário")

    pages = json.loads(pending.pages_json or "[]")
    selected = next((p for p in pages if p.get("id") == data.page_id), None)
    if not selected:
        raise HTTPException(status_code=404, detail="Página selecionada não encontrada")

    ig_account = selected.get("ig")
    if not ig_account:
        raise HTTPException(status_code=400, detail="Página sem Instagram Business vinculado")

    token = decrypt_secret(pending.token_encrypted or "")
    if not token:
        raise HTTPException(status_code=400, detail="Token OAuth inválido")

    client_name = pending.client_name or selected.get("name") or "Cliente Meta"

    existing = db.query(Client).filter(Client.page_id == selected["id"]).first()
    if existing:
        existing.name = client_name
        existing.ig_id = ig_account["id"]
        existing.ad_account_id = data.ad_account_id
        existing.access_token = encrypt_secret(token)
        db.commit()
        db.refresh(existing)
        client_row = existing
    else:
        client_row = Client(
            name=client_name,
            page_id=selected["id"],
            ig_id=ig_account["id"],
            ad_account_id=data.ad_account_id,
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

    pending.status = "completed"
    db.commit()
    return {"ok": True, "client_id": client_row.id, "client_name": client_row.name}


@router.get("/meta/reconnect-required")
async def reconnect_required(client_id: int, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    client_row = db.query(Client).filter(Client.id == client_id).first()
    if not client_row:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    if current.role != "admin":
        allowed = (
            db.query(UserClientAccess)
            .filter(UserClientAccess.user_id == current.id, UserClientAccess.client_id == client_row.id)
            .first()
        )
        if not allowed:
            raise HTTPException(status_code=403, detail="Sem acesso ao cliente")

    token = decrypt_secret(client_row.access_token)
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(f"{settings.meta_base_url}/me", params={"access_token": token})

    if resp.status_code == 200:
        return {"requires_reconnect": False}

    return {"requires_reconnect": True, "reason": "token_invalid_or_expired"}
