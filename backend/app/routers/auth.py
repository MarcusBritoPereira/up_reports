from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User

router = APIRouter()


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.email == data.email).first()
    if exists:
        raise HTTPException(status_code=409, detail="Email já cadastrado")

    is_first_user = db.query(User).count() == 0
    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role="admin" if is_first_user else "social_media",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "email": user.email, "role": user.role}


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Usuário inativo")

    token = create_access_token(
        {
            "id": user.id,
            "email": user.email,
            "role": user.role,
        }
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
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
