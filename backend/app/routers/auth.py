import time
from collections import defaultdict

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
from app.models import User

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


@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    user_count = db.query(User).count()
    can_register = settings.auth_allow_public_registration or user_count == 0
    if not can_register:
        raise HTTPException(status_code=403, detail="Registro público desabilitado. Solicite convite ao administrador.")

    exists = db.query(User).filter(User.email == data.email).first()
    if exists:
        raise HTTPException(status_code=409, detail="Email já cadastrado")

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role="admin" if user_count == 0 else "social_media",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "email": user.email, "role": user.role}


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
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=f"Refresh token inválido: {exc}") from exc

    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuário inválido ou inativo")

    subject = {
        "id": user.id,
        "email": user.email,
        "role": user.role,
    }
    return {
        "access_token": create_access_token(subject),
        "token_type": "bearer",
        "expires_in": settings.auth_access_token_ttl_seconds,
    }


@router.get("/me")
def me(current: User = Depends(get_current_user)):
    return {
        "id": current.id,
        "name": current.name,
        "email": current.email,
        "role": current.role,
        "is_active": current.is_active,
    }
