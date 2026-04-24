import json
from sqlalchemy.orm import Session

from app.models import AuditLog, User


def log_audit(db: Session, action: str, user: User | None = None, details: dict | None = None, request_id: str | None = None) -> None:
    entry = AuditLog(
        user_id=user.id if user else None,
        action=action,
        details=json.dumps(details or {}, ensure_ascii=False),
        request_id=request_id,
    )
    db.add(entry)
    db.commit()
