import json
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models import (
    Client,
    User,
    UserClientAccess,
    WhatsAppConnection,
    WhatsAppGroup,
    WhatsAppMessageTemplate,
    WhatsAppReportSchedule,
)

router = APIRouter()

VALID_FREQUENCIES = {"daily", "weekly", "monthly"}
VALID_REPORT_TYPES = {"all", "organic", "paid"}


class WhatsAppConnectionCreate(BaseModel):
    client_id: int
    provider: str = Field(default="qr_provider", max_length=80)
    phone_label: str | None = Field(default=None, max_length=120)


class WhatsAppConnectionStatusUpdate(BaseModel):
    status: str = Field(max_length=40)
    phone_label: str | None = Field(default=None, max_length=120)


class WhatsAppGroupUpsert(BaseModel):
    external_group_id: str = Field(min_length=1, max_length=160)
    name: str = Field(min_length=1, max_length=160)
    selected: bool = True


class WhatsAppGroupSelection(BaseModel):
    selected: bool


class WhatsAppTemplateCreate(BaseModel):
    client_id: int | None = None
    name: str = Field(min_length=2, max_length=120)
    body: str = Field(min_length=2)
    variables: list[str] = []
    is_default: bool = False


class WhatsAppTemplateUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    body: str | None = Field(default=None, min_length=2)
    variables: list[str] | None = None
    is_default: bool | None = None


class WhatsAppScheduleCreate(BaseModel):
    client_id: int
    group_id: int
    template_id: int
    report_type: str = Field(default="all")
    period_days: int = Field(default=30, ge=1, le=365)
    frequency: str = Field(default="weekly")
    send_time: str = Field(default="09:00", pattern=r"^([01]\\d|2[0-3]):[0-5]\\d$")
    timezone: str = Field(default="America/Sao_Paulo", max_length=80)
    is_active: bool = True


class WhatsAppScheduleUpdate(BaseModel):
    group_id: int | None = None
    template_id: int | None = None
    report_type: str | None = None
    period_days: int | None = Field(default=None, ge=1, le=365)
    frequency: str | None = None
    send_time: str | None = Field(default=None, pattern=r"^([01]\\d|2[0-3]):[0-5]\\d$")
    timezone: str | None = Field(default=None, max_length=80)
    is_active: bool | None = None


def _check_client_access(db: Session, client_id: int, current: User) -> Client:
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    if current.role != "admin":
        allowed = (
            db.query(UserClientAccess)
            .filter(UserClientAccess.user_id == current.id, UserClientAccess.client_id == client_id)
            .first()
        )
        if not allowed:
            raise HTTPException(status_code=403, detail="Usuário sem acesso a este cliente")
    return client


def _connection_response(row: WhatsAppConnection) -> dict:
    return {
        "id": row.id,
        "client_id": row.client_id,
        "provider": row.provider,
        "phone_label": row.phone_label,
        "status": row.status,
        "qr_payload": row.qr_payload,
        "qr_expires_at": row.qr_expires_at.isoformat() if row.qr_expires_at else None,
        "last_sync_at": row.last_sync_at.isoformat() if row.last_sync_at else None,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def _group_response(row: WhatsAppGroup) -> dict:
    return {
        "id": row.id,
        "client_id": row.client_id,
        "connection_id": row.connection_id,
        "external_group_id": row.external_group_id,
        "name": row.name,
        "selected": row.selected,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def _template_response(row: WhatsAppMessageTemplate) -> dict:
    return {
        "id": row.id,
        "client_id": row.client_id,
        "name": row.name,
        "body": row.body,
        "variables": json.loads(row.variables_json or "[]"),
        "is_default": row.is_default,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def _schedule_response(row: WhatsAppReportSchedule) -> dict:
    return {
        "id": row.id,
        "client_id": row.client_id,
        "group_id": row.group_id,
        "template_id": row.template_id,
        "report_type": row.report_type,
        "period_days": row.period_days,
        "frequency": row.frequency,
        "send_time": row.send_time,
        "timezone": row.timezone,
        "is_active": row.is_active,
        "next_run_at": row.next_run_at.isoformat() if row.next_run_at else None,
        "last_run_at": row.last_run_at.isoformat() if row.last_run_at else None,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def _validate_report_schedule(report_type: str, frequency: str) -> None:
    if report_type not in VALID_REPORT_TYPES:
        raise HTTPException(status_code=400, detail="Tipo de relatório inválido")
    if frequency not in VALID_FREQUENCIES:
        raise HTTPException(status_code=400, detail="Frequência inválida")


def _next_run_for(frequency: str) -> datetime:
    now = datetime.utcnow()
    if frequency == "daily":
        return now + timedelta(days=1)
    if frequency == "monthly":
        return now + timedelta(days=30)
    return now + timedelta(days=7)


@router.get("/risk-note")
def whatsapp_risk_note():
    return {
        "official_api": "A API oficial da WhatsApp Business Platform é a opção mais segura para evitar bloqueios, mas normalmente trabalha com conversas 1:1 e templates aprovados.",
        "qr_group_automation": "Conexões por QR baseadas em WhatsApp Web/terceiros podem listar grupos e enviar para grupos, mas têm risco operacional e de conformidade. Use número dedicado, opt-in e baixo volume.",
        "recommended_path": "Separe o número pessoal/operacional da agência de automações e use este módulo com um provedor homologado ou conector interno com controle de rate limit.",
    }


@router.get("/connections")
def list_connections(client_id: int, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _check_client_access(db, client_id, current)
    rows = db.query(WhatsAppConnection).filter(WhatsAppConnection.client_id == client_id).order_by(WhatsAppConnection.created_at.desc()).all()
    return [_connection_response(row) for row in rows]


@router.post("/connections")
def create_connection(data: WhatsAppConnectionCreate, current: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    _check_client_access(db, data.client_id, current)
    row = WhatsAppConnection(client_id=data.client_id, provider=data.provider, phone_label=data.phone_label, status="disconnected")
    db.add(row)
    db.commit()
    db.refresh(row)
    return _connection_response(row)


@router.post("/connections/{connection_id}/qr")
def start_qr_pairing(connection_id: int, current: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    row = db.query(WhatsAppConnection).filter(WhatsAppConnection.id == connection_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Conexão WhatsApp não encontrada")
    _check_client_access(db, row.client_id, current)
    row.status = "qr_pending"
    row.qr_payload = f"up-reports://whatsapp/pair/{connection_id}/{secrets.token_urlsafe(24)}"
    row.qr_expires_at = datetime.utcnow() + timedelta(minutes=2)
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return _connection_response(row)


@router.patch("/connections/{connection_id}/status")
def update_connection_status(connection_id: int, data: WhatsAppConnectionStatusUpdate, current: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    row = db.query(WhatsAppConnection).filter(WhatsAppConnection.id == connection_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Conexão WhatsApp não encontrada")
    _check_client_access(db, row.client_id, current)
    row.status = data.status
    if data.phone_label is not None:
        row.phone_label = data.phone_label
    if data.status == "connected":
        row.qr_payload = None
        row.qr_expires_at = None
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return _connection_response(row)


@router.get("/groups")
def list_groups(client_id: int, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _check_client_access(db, client_id, current)
    rows = db.query(WhatsAppGroup).filter(WhatsAppGroup.client_id == client_id).order_by(WhatsAppGroup.name.asc()).all()
    return [_group_response(row) for row in rows]


@router.post("/connections/{connection_id}/groups")
def upsert_groups(connection_id: int, data: list[WhatsAppGroupUpsert], current: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    connection = db.query(WhatsAppConnection).filter(WhatsAppConnection.id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Conexão WhatsApp não encontrada")
    _check_client_access(db, connection.client_id, current)
    synced = []
    for item in data:
        row = (
            db.query(WhatsAppGroup)
            .filter(WhatsAppGroup.connection_id == connection_id, WhatsAppGroup.external_group_id == item.external_group_id)
            .first()
        )
        if row:
            row.name = item.name
            row.selected = item.selected
            row.updated_at = datetime.utcnow()
        else:
            row = WhatsAppGroup(
                client_id=connection.client_id,
                connection_id=connection_id,
                external_group_id=item.external_group_id,
                name=item.name,
                selected=item.selected,
            )
            db.add(row)
        synced.append(row)
    connection.last_sync_at = datetime.utcnow()
    connection.updated_at = datetime.utcnow()
    db.commit()
    return [_group_response(row) for row in synced]


@router.patch("/groups/{group_id}/selection")
def update_group_selection(group_id: int, data: WhatsAppGroupSelection, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(WhatsAppGroup).filter(WhatsAppGroup.id == group_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Grupo WhatsApp não encontrado")
    _check_client_access(db, row.client_id, current)
    row.selected = data.selected
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return _group_response(row)


@router.get("/templates")
def list_templates(client_id: int | None = None, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if client_id is not None:
        _check_client_access(db, client_id, current)
        rows = (
            db.query(WhatsAppMessageTemplate)
            .filter((WhatsAppMessageTemplate.client_id == client_id) | (WhatsAppMessageTemplate.client_id.is_(None)))
            .order_by(WhatsAppMessageTemplate.is_default.desc(), WhatsAppMessageTemplate.name.asc())
            .all()
        )
    else:
        if current.role != "admin":
            raise HTTPException(status_code=400, detail="client_id é obrigatório para este perfil")
        rows = db.query(WhatsAppMessageTemplate).order_by(WhatsAppMessageTemplate.name.asc()).all()
    return [_template_response(row) for row in rows]


@router.post("/templates")
def create_template(data: WhatsAppTemplateCreate, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.client_id is not None:
        _check_client_access(db, data.client_id, current)
    elif current.role != "admin":
        raise HTTPException(status_code=403, detail="Somente admin pode criar template global")
    row = WhatsAppMessageTemplate(
        client_id=data.client_id,
        name=data.name,
        body=data.body,
        variables_json=json.dumps(data.variables, ensure_ascii=False),
        is_default=data.is_default,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _template_response(row)


@router.patch("/templates/{template_id}")
def update_template(template_id: int, data: WhatsAppTemplateUpdate, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(WhatsAppMessageTemplate).filter(WhatsAppMessageTemplate.id == template_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Template não encontrado")
    if row.client_id is not None:
        _check_client_access(db, row.client_id, current)
    elif current.role != "admin":
        raise HTTPException(status_code=403, detail="Somente admin pode editar template global")
    payload = data.model_dump(exclude_unset=True)
    if "name" in payload:
        row.name = payload["name"]
    if "body" in payload:
        row.body = payload["body"]
    if "variables" in payload:
        row.variables_json = json.dumps(payload["variables"], ensure_ascii=False)
    if "is_default" in payload:
        row.is_default = payload["is_default"]
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return _template_response(row)


@router.get("/schedules")
def list_schedules(client_id: int, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _check_client_access(db, client_id, current)
    rows = db.query(WhatsAppReportSchedule).filter(WhatsAppReportSchedule.client_id == client_id).order_by(WhatsAppReportSchedule.created_at.desc()).all()
    return [_schedule_response(row) for row in rows]


@router.post("/schedules")
def create_schedule(data: WhatsAppScheduleCreate, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _check_client_access(db, data.client_id, current)
    _validate_report_schedule(data.report_type, data.frequency)
    group = db.query(WhatsAppGroup).filter(WhatsAppGroup.id == data.group_id, WhatsAppGroup.client_id == data.client_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Grupo WhatsApp não encontrado para este cliente")
    template = db.query(WhatsAppMessageTemplate).filter(WhatsAppMessageTemplate.id == data.template_id).first()
    if not template or (template.client_id not in (None, data.client_id)):
        raise HTTPException(status_code=404, detail="Template não encontrado para este cliente")
    row = WhatsAppReportSchedule(
        client_id=data.client_id,
        group_id=data.group_id,
        template_id=data.template_id,
        report_type=data.report_type,
        period_days=data.period_days,
        frequency=data.frequency,
        send_time=data.send_time,
        timezone=data.timezone,
        is_active=data.is_active,
        next_run_at=_next_run_for(data.frequency) if data.is_active else None,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _schedule_response(row)


@router.patch("/schedules/{schedule_id}")
def update_schedule(schedule_id: int, data: WhatsAppScheduleUpdate, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(WhatsAppReportSchedule).filter(WhatsAppReportSchedule.id == schedule_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    _check_client_access(db, row.client_id, current)
    payload = data.model_dump(exclude_unset=True)
    report_type = payload.get("report_type", row.report_type)
    frequency = payload.get("frequency", row.frequency)
    _validate_report_schedule(report_type, frequency)
    if "group_id" in payload:
        group = db.query(WhatsAppGroup).filter(WhatsAppGroup.id == payload["group_id"], WhatsAppGroup.client_id == row.client_id).first()
        if not group:
            raise HTTPException(status_code=404, detail="Grupo WhatsApp não encontrado para este cliente")
        row.group_id = payload["group_id"]
    if "template_id" in payload:
        template = db.query(WhatsAppMessageTemplate).filter(WhatsAppMessageTemplate.id == payload["template_id"]).first()
        if not template or (template.client_id not in (None, row.client_id)):
            raise HTTPException(status_code=404, detail="Template não encontrado para este cliente")
        row.template_id = payload["template_id"]
    for field in ("report_type", "period_days", "frequency", "send_time", "timezone", "is_active"):
        if field in payload:
            setattr(row, field, payload[field])
    row.next_run_at = _next_run_for(row.frequency) if row.is_active else None
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return _schedule_response(row)
