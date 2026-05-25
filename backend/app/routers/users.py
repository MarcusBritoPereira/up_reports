from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_roles
from app.models import User, UserClientAccess, Client

router = APIRouter()

ROLES = {"admin", "social_media", "analyst"}


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    role: str = Field(default="social_media")


class UserRoleUpdate(BaseModel):
    role: str
    is_active: bool


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool


class UserClientsUpdate(BaseModel):
    client_ids: list[int] = Field(default_factory=list)


class ActivateUserRequest(BaseModel):
    password: str = Field(min_length=8, max_length=128)


def _validate_role(role: str) -> str:
    if role not in ROLES:
        raise HTTPException(status_code=422, detail=f"Role inválida. Use: {', '.join(sorted(ROLES))}")
    return role


def _user_out(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
    }


@router.get("/")
def list_users(_: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    return [_user_out(u) for u in db.query(User).order_by(User.created_at.desc()).all()]


@router.post("/")
def create_user(data: UserCreate, _: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    email = data.email.lower().strip()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="Email já cadastrado")

    user = User(name=data.name, email=email, password_hash="pending_invite", role=_validate_role(data.role), is_active=False)
    db.add(user)
    db.commit()
    db.refresh(user)
    return _user_out(user)


@router.patch("/{user_id}")
def update_user(user_id: int, data: UserRoleUpdate, _: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    user.role = _validate_role(data.role)
    user.is_active = data.is_active
    db.commit()
    db.refresh(user)
    return _user_out(user)


@router.get("/{user_id}/clients")
def get_user_clients(user_id: int, _: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    links = db.query(UserClientAccess).filter(UserClientAccess.user_id == user_id).all()
    return {"user_id": user_id, "client_ids": [l.client_id for l in links]}


@router.put("/{user_id}/clients")
def set_user_clients(user_id: int, data: UserClientsUpdate, _: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if data.client_ids:
        existing = db.query(Client.id).filter(Client.id.in_(data.client_ids)).all()
        existing_ids = {row[0] for row in existing}
        missing = sorted(set(data.client_ids) - existing_ids)
        if missing:
            raise HTTPException(status_code=404, detail=f"Clientes não encontrados: {missing}")

    db.query(UserClientAccess).filter(UserClientAccess.user_id == user_id).delete()
    for cid in sorted(set(data.client_ids)):
        db.add(UserClientAccess(user_id=user_id, client_id=cid))
    db.commit()
    return {"ok": True, "user_id": user_id, "client_ids": sorted(set(data.client_ids))}
