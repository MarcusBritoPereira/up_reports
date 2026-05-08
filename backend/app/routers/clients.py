from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.secrets import encrypt_secret
from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models import Client, User, UserClientAccess

router = APIRouter()


class ClientCreate(BaseModel):
    name: str
    page_id: str
    ig_id: str
    access_token: str


class ClientAccessCreate(BaseModel):
    user_id: int


def _client_response(client: Client) -> dict:
    return {
        "id": client.id,
        "name": client.name,
        "page_id": client.page_id,
        "ig_id": client.ig_id,
        "ad_account_id": client.ad_account_id,
        "profile_picture_url": client.profile_picture_url,
        "created_at": client.created_at,
    }


@router.get("/")
def list_clients(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current.role == "admin":
        clients = db.query(Client).all()
    else:
        clients = (
            db.query(Client)
            .join(UserClientAccess, UserClientAccess.client_id == Client.id)
            .filter(UserClientAccess.user_id == current.id)
            .all()
        )

    return [_client_response(client) for client in clients]


@router.post("/")
def create_client(data: ClientCreate, _: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    payload = data.model_dump()
    payload["access_token"] = encrypt_secret(payload["access_token"])
    client = Client(**payload)
    db.add(client)
    db.commit()
    db.refresh(client)
    return _client_response(client)


@router.post("/{client_id}/access")
def grant_access(
    client_id: int,
    data: ClientAccessCreate,
    _: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    exists = (
        db.query(UserClientAccess)
        .filter(UserClientAccess.user_id == data.user_id, UserClientAccess.client_id == client_id)
        .first()
    )
    if exists:
        return {"ok": True, "message": "Acesso já existia"}

    access = UserClientAccess(user_id=data.user_id, client_id=client_id)
    db.add(access)
    db.commit()
    return {"ok": True}


class ClientUpdate(BaseModel):
    name: str
    ad_account_id: str | None = None

@router.put("/{client_id}")
def update_client(
    client_id: int, 
    data: ClientUpdate, 
    current: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    c = db.query(Client).filter(Client.id == client_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    if current.role != "admin":
        access = (
            db.query(UserClientAccess)
            .filter(UserClientAccess.user_id == current.id, UserClientAccess.client_id == c.id)
            .first()
        )
        if not access:
            raise HTTPException(status_code=403, detail="Sem acesso ao cliente")

    c.name = data.name
    if data.ad_account_id is not None:
        c.ad_account_id = data.ad_account_id
    db.commit()
    db.refresh(c)
    return _client_response(c)

@router.delete("/{client_id}")
def delete_client(client_id: int, _: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    db.delete(client)
    db.commit()
    return {"ok": True}
