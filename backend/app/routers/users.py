from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_roles
from app.models import User

router = APIRouter()


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    role: str = Field(default="social_media")


class UserRoleUpdate(BaseModel):
    role: str
    is_active: bool


@router.get("/")
def list_users(_: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    return db.query(User).all()


@router.post("/")
def create_user(data: UserCreate, _: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=409, detail="Email já cadastrado")

    user = User(name=data.name, email=data.email, password_hash="pending_invite", role=data.role, is_active=False)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}")
def update_user(user_id: int, data: UserRoleUpdate, _: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    user.role = data.role
    user.is_active = data.is_active
    db.commit()
    db.refresh(user)
    return user
