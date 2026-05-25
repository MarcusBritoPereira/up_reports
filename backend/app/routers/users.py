from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.database import get_db
from app.dependencies import require_roles
from app.models import User

router = APIRouter()


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: str = Field(default="social_media")


class UserRoleUpdate(BaseModel):
    role: str
    is_active: bool


def _serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at,
    }


@router.get("/")
def list_users(_: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [_serialize_user(user) for user in users]


@router.post("/")
def create_user(data: UserCreate, _: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    email = data.email.lower().strip()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="Email já cadastrado")

    user = User(
        name=data.name.strip(),
        email=email,
        password_hash=hash_password(data.password),
        role=data.role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _serialize_user(user)


@router.patch("/{user_id}")
def update_user(user_id: int, data: UserRoleUpdate, _: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    user.role = data.role
    user.is_active = data.is_active
    db.commit()
    db.refresh(user)
    return _serialize_user(user)
