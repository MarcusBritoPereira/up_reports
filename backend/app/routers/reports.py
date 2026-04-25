import csv
import io
import json
from datetime import UTC, date, datetime, timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.audit import log_audit
from app.core.config import settings
from app.core.secrets import decrypt_secret
from app.database import get_db
from app.dependencies import get_current_user
from app.models import Client, MetricSnapshot, User, UserClientAccess

router = APIRouter()


def _check_client_access(db: Session, client_id: int, current: User) -> Client:
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

    return c


from typing import Optional, List, Dict

def _extract_insight(insights_data: list, metric: str) -> Optional[int]:
    for row in insights_data:
        if row.get("name") == metric:
            values = row.get("values") or []
            if values:
                return values[0].get("value")
    return None


@router.post("/snapshots/collect")
async def collect_snapshot(
    client_id: int, 
    background_tasks: BackgroundTasks,
    current: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    c = _check_client_access(db, client_id, current)
    token = decrypt_secret(c.access_token)

    async with httpx.AsyncClient(timeout=20) as client:
        profile_resp = await client.get(
            f"{settings.meta_base_url}/{c.ig_id}",
            params={
                "fields": "id,name,username,followers_count,follows_count,media_count",
                "access_token": token,
            },
        )
        insights_resp = await client.get(
            f"{settings.meta_base_url}/{c.ig_id}/insights",
            params={"metric": "reach,impressions,profile_views", "period": "day", "access_token": token},
        )

    if profile_resp.status_code != 200:
        raise HTTPException(status_code=profile_resp.status_code, detail=profile_resp.json())
    if insights_resp.status_code != 200:
        raise HTTPException(status_code=insights_resp.status_code, detail=insights_resp.json())

    profile = profile_resp.json()
    insights = insights_resp.json().get("data", [])

    snapshot = MetricSnapshot(
        client_id=c.id,
        snapshot_date=date.today(),
        followers=profile.get("followers_count"),
        follows=profile.get("follows_count"),
        media_count=profile.get("media_count"),
        reach=_extract_insight(insights, "reach"),
        impressions=_extract_insight(insights, "impressions"),
        profile_views=_extract_insight(insights, "profile_views"),
        raw_json=json.dumps({"profile": profile, "insights": insights}, ensure_ascii=False),
    )
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    
    # Run heavy archive collections in background
    background_tasks.add_task(run_heavy_collection, client_id, current, db)

    log_audit(db, action="report.snapshot.collect", user=current, details={"client_id": c.id, "snapshot_id": snapshot.id})

    return {"ok": True, "snapshot_id": snapshot.id, "snapshot_date": str(snapshot.snapshot_date)}

async def run_heavy_collection(client_id: int, current: User, db: Session):
    from app.routers.instagram import collect_active_stories, collect_audience_archive, collect_media_archive
    try:
        # We need a new session or be careful with the current one. 
        # But for background tasks in FastAPI with Depends(get_db), it's better to manage it.
        await collect_active_stories(client_id, current, db)
        await collect_audience_archive(client_id, current, db)
        await collect_media_archive(client_id, current, db)
    except Exception as e:
        import logging
        logging.error(f"Failed to collect archives in background: {e}")


@router.get("/snapshots")
def list_snapshots(client_id: int, days: int = 30, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = _check_client_access(db, client_id, current)
    since = date.today() - timedelta(days=max(days, 1))
    rows = (
        db.query(MetricSnapshot)
        .filter(MetricSnapshot.client_id == c.id, MetricSnapshot.snapshot_date >= since)
        .order_by(MetricSnapshot.snapshot_date.asc())
        .all()
    )

    return [
        {
            "date": str(r.snapshot_date),
            "followers": r.followers,
            "follows": r.follows,
            "media_count": r.media_count,
            "reach": r.reach,
            "impressions": r.impressions,
            "profile_views": r.profile_views,
        }
        for r in rows
    ]


@router.get("/summary")
def report_summary(client_id: int, days: int = 30, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from datetime import date, timedelta
    
    # Query double the days to get previous period
    all_rows = list_snapshots(client_id=client_id, days=days * 2, current=current, db=db)
    
    cutoff = date.today() - timedelta(days=days)
    
    current_rows = [r for r in all_rows if date.fromisoformat(r["date"]) > cutoff]
    previous_rows = [r for r in all_rows if date.fromisoformat(r["date"]) <= cutoff]
    
    if not current_rows:
        return {"period_days": days, "total_snapshots": 0, "latest": None, "deltas": {}, "totals": {}}

    latest = current_rows[-1]
    last_previous = previous_rows[-1] if previous_rows else current_rows[0]
    
    # Calculate sums for daily metrics
    def sum_metric(rows, metric):
        return sum((r.get(metric) or 0) for r in rows)
        
    curr_reach = sum_metric(current_rows, "reach")
    prev_reach = sum_metric(previous_rows, "reach")
    
    curr_imp = sum_metric(current_rows, "impressions")
    prev_imp = sum_metric(previous_rows, "impressions")
    
    curr_views = sum_metric(current_rows, "profile_views")
    prev_views = sum_metric(previous_rows, "profile_views")

    def calc_pct(curr, prev):
        if prev == 0: return 0
        return round(((curr - prev) / prev) * 100, 2)

    deltas = {
        "followers": calc_pct(latest.get("followers") or 0, last_previous.get("followers") or 0),
        "reach": calc_pct(curr_reach, prev_reach),
        "impressions": calc_pct(curr_imp, prev_imp),
        "profile_views": calc_pct(curr_views, prev_views)
    }
    
    totals = {
        "reach": curr_reach,
        "impressions": curr_imp,
        "profile_views": curr_views,
        "prev_reach": prev_reach,
        "prev_impressions": prev_imp,
        "prev_profile_views": prev_views
    }

    return {
        "period_days": days,
        "total_snapshots": len(current_rows),
        "latest": latest,
        "totals": totals,
        "deltas": deltas,
        "delta_followers": (latest.get("followers") or 0) - (current_rows[0].get("followers") or 0),
    }


@router.get("/export/csv")
def export_csv(client_id: int, days: int = 30, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = list_snapshots(client_id=client_id, days=days, current=current, db=db)
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["date", "followers", "follows", "media_count", "reach", "impressions", "profile_views"])
    writer.writeheader()
    for row in rows:
        writer.writerow(row)

    log_audit(db, action="report.export.csv", user=current, details={"client_id": client_id, "days": days})

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=client_{client_id}_report.csv"},
    )


def _simple_pdf(lines: list[str]) -> bytes:
    content = "\n".join(lines)
    stream = f"BT /F1 12 Tf 50 760 Td ({content.replace('(', '[').replace(')', ']')}) Tj ET"
    pdf = f"%PDF-1.4\n1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n4 0 obj<< /Length {len(stream)} >>stream\n{stream}\nendstream endobj\n5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000062 00000 n \n0000000120 00000 n \n0000000270 00000 n \n0000000400 00000 n \ntrailer<< /Root 1 0 R /Size 6 >>\nstartxref\n470\n%%EOF"
    return pdf.encode("latin-1", errors="ignore")


@router.get("/export/pdf")
def export_pdf(client_id: int, days: int = 30, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    summary = report_summary(client_id=client_id, days=days, current=current, db=db)
    lines = [
        f"Relatorio cliente {client_id}",
        f"Periodo (dias): {days}",
        f"Snapshots: {summary.get('total_snapshots')}",
        f"Delta seguidores: {summary.get('delta_followers')}",
        f"Gerado em: {datetime.now(UTC).isoformat()}",
    ]
    pdf = _simple_pdf(lines)

    log_audit(db, action="report.export.pdf", user=current, details={"client_id": client_id, "days": days})

    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=client_{client_id}_report.pdf"},
    )
