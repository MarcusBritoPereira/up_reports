from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models import User

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Não autenticado")

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = payload.get("sub", {}).get("id")
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=f"Token inválido: {exc}") from exc

    if not user_id:
        raise HTTPException(status_code=401, detail="Token sem usuário")

    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuário inválido ou inativo")
    return user


def require_roles(*allowed_roles: str):
    def _checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Sem permissão para este recurso")
        return user

    return _checker
