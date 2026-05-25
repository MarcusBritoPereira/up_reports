import time
from collections import defaultdict
from datetime import datetime, UTC

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.dependencies import get_current_user
from app.models import RevokedToken, User

router = APIRouter()

MAX_ATTEMPTS = 5
BLOCK_WINDOW_SECONDS = 15 * 60
_login_attempts = defaultdict(list)


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class ActivateRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


def _check_bruteforce(email: str) -> None:
    now = time.time()
    recent = [ts for ts in _login_attempts[email] if now - ts < BLOCK_WINDOW_SECONDS]
    _login_attempts[email] = recent
    if len(recent) >= MAX_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Muitas tentativas. Tente novamente em alguns minutos.")


def _register_failure(email: str) -> None:
    _login_attempts[email].append(time.time())


def _clear_failures(email: str) -> None:
    _login_attempts[email] = []


def _is_token_revoked(db: Session, jti: str | None) -> bool:
    if not jti:
        return True
    return db.query(RevokedToken).filter(RevokedToken.jti == jti).first() is not None


def _revoke_refresh_token(db: Session, payload: dict) -> None:
    jti = payload.get("jti")
    if not jti or _is_token_revoked(db, jti):
        return

    exp = payload.get("exp", 0)
    revoked = RevokedToken(
        jti=jti,
        token_type="refresh",
        expires_at=datetime.fromtimestamp(exp, tz=UTC),
    )
    db.add(revoked)
    db.commit()


@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    user_count = db.query(User).count()
    can_register = settings.auth_allow_public_registration or user_count == 0
    if not can_register:
        raise HTTPException(status_code=403, detail="Registro público desabilitado. Solicite convite ao administrador.")

    email = data.email.lower().strip()
    exists = db.query(User).filter(User.email == email).first()
    if exists:
        raise HTTPException(status_code=409, detail="Email já cadastrado")

    user = User(
        name=data.name,
        email=email,
        password_hash=hash_password(data.password),
        role="admin" if user_count == 0 else "social_media",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "email": user.email, "role": user.role}




@router.post("/activate")
def activate_user(data: ActivateRequest, db: Session = Depends(get_db)):
    email = data.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if user.password_hash != "pending_invite" and user.is_active:
        raise HTTPException(status_code=409, detail="Usuário já ativado")

    user.password_hash = hash_password(data.password)
    user.is_active = True
    db.commit()
    return {"ok": True}


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    email = data.email.lower().strip()
    _check_bruteforce(email)

    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(data.password, user.password_hash):
        _register_failure(email)
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    if not user.is_active:
        _register_failure(email)
        raise HTTPException(status_code=403, detail="Usuário inativo")

    _clear_failures(email)

    subject = {
        "id": user.id,
        "email": user.email,
        "role": user.role,
    }
    return {
        "access_token": create_access_token(subject),
        "refresh_token": create_refresh_token({"id": user.id}),
        "token_type": "bearer",
        "expires_in": settings.auth_access_token_ttl_seconds,
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
    }


@router.post("/refresh")
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_refresh_token(data.refresh_token)
        user_id = payload.get("sub", {}).get("id")
        jti = payload.get("jti")
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=f"Refresh token inválido: {exc}") from exc

    if _is_token_revoked(db, jti):
        raise HTTPException(status_code=401, detail="Refresh token revogado")

    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuário inválido ou inativo")

    _revoke_refresh_token(db, payload)

    subject = {
        "id": user.id,
        "email": user.email,
        "role": user.role,
    }
    return {
        "access_token": create_access_token(subject),
        "refresh_token": create_refresh_token({"id": user.id}),
        "token_type": "bearer",
        "expires_in": settings.auth_access_token_ttl_seconds,
    }


@router.post("/logout")
def logout(data: RefreshRequest, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        payload = decode_refresh_token(data.refresh_token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=f"Refresh token inválido: {exc}") from exc

    token_user_id = payload.get("sub", {}).get("id")
    if token_user_id != current.id:
        raise HTTPException(status_code=403, detail="Token não pertence ao usuário autenticado")

    _revoke_refresh_token(db, payload)
    return {"ok": True}


@router.get("/me")
def me(current: User = Depends(get_current_user)):
    return {
        "id": current.id,
        "name": current.name,
        "email": current.email,
        "role": current.role,
        "is_active": current.is_active,
    }
