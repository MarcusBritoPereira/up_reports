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
from app.models import Client, MetricSnapshot, User, UserClientAccess, ReportHistory
from pydantic import BaseModel

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

    # Check if we already have snapshots. If not, we try to fetch historical data (last 30 days)
    has_history = db.query(MetricSnapshot).filter(MetricSnapshot.client_id == c.id).first()
    
    async with httpx.AsyncClient(timeout=30) as client:
        # 1. Fetch current profile state
        profile_resp = await client.get(
            f"{settings.meta_base_url}/{c.ig_id}",
            params={
                "fields": "id,name,username,followers_count,follows_count,media_count",
                "access_token": token,
            },
        )
        if profile_resp.status_code != 200:
            raise HTTPException(status_code=profile_resp.status_code, detail=profile_resp.json())
        profile = profile_resp.json()

        # 2. Fetch insights
        # Core metrics that work with period=day
        metrics = "reach"
        params = {
            "metric": metrics,
            "period": "day",
            "access_token": token
        }
        
        if not has_history:
            # Fetch last 30 days to populate the dashboard immediately
            # Using YYYY-MM-DD format which is more reliable for Instagram insights
            until = date.today() - timedelta(days=1)
            since = until - timedelta(days=29)
            params["since"] = since.strftime("%Y-%m-%d")
            params["until"] = until.strftime("%Y-%m-%d")

        insights_resp = await client.get(f"{settings.meta_base_url}/{c.ig_id}/insights", params=params)
        
        if insights_resp.status_code != 200:
            # Fallback or error
            raise HTTPException(status_code=insights_resp.status_code, detail=insights_resp.json())
        
        insights_data = insights_resp.json().get("data", [])
        
        # Process insights. If we requested a range, it returns multiple values per metric.
        # We need to pivot this into daily snapshots.
        daily_map = {} # date_str -> {metric: value}
        
        for m in insights_data:
            m_name = m["name"]
            for val_entry in m.get("values", []):
                # end_time is like "2024-05-01T07:00:00+0000"
                dt_str = val_entry["end_time"].split("T")[0]
                if dt_str not in daily_map: daily_map[dt_str] = {}
                daily_map[dt_str][m_name] = val_entry["value"]

        # Save snapshots
        for dt_str, vals in daily_map.items():
            snapshot_date = date.fromisoformat(dt_str)
            # Avoid duplicates
            exists = db.query(MetricSnapshot).filter(
                MetricSnapshot.client_id == c.id, 
                MetricSnapshot.snapshot_date == snapshot_date
            ).first()
            
            if exists:
                exists.followers = profile.get("followers_count") # Use current followers as best guess
                exists.reach = vals.get("reach", 0)
                exists.impressions = vals.get("impressions", 0)
                exists.profile_views = vals.get("profile_views", 0)
                exists.website_clicks = vals.get("website_clicks", 0)
            else:
                db.add(MetricSnapshot(
                    client_id=c.id,
                    snapshot_date=snapshot_date,
                    followers=profile.get("followers_count") if snapshot_date == date.today() else None,
                    reach=vals.get("reach", 0),
                    impressions=vals.get("impressions", 0),
                    profile_views=vals.get("profile_views", 0),
                    website_clicks=vals.get("website_clicks", 0),
                    phone_call_clicks=vals.get("phone_call_clicks", 0),
                    email_contacts=vals.get("email_contacts", 0),
                    get_directions_clicks=vals.get("get_directions_clicks", 0)
                ))
    
    db.commit()
    
    # Run heavy archive collections in background
    background_tasks.add_task(run_heavy_collection, client_id, current, db)
    log_audit(db, action="report.snapshot.collect.history", user=current, details={"client_id": c.id})

    return {"ok": True, "history_fetched": not has_history}

async def run_heavy_collection(client_id: int, current: User, db: Session):
    from app.routers.instagram import collect_audience_archive, collect_media_archive
    try:
        # We need a new session or be careful with the current one. 
        # But for background tasks in FastAPI with Depends(get_db), it's better to manage it.
        # Stories collection not yet implemented or moved
        await collect_audience_archive(client_id, current, db)
        await collect_media_archive(client_id, current, db)
    except Exception as e:
        import logging
        logging.error(f"Failed to collect archives in background: {e}")


@router.get("/snapshots")
def list_snapshots(
    client_id: int, 
    days: Optional[int] = None, 
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    c = _check_client_access(db, client_id, current)
    
    query = db.query(MetricSnapshot).filter(MetricSnapshot.client_id == c.id)
    
    if start_date and end_date:
        query = query.filter(MetricSnapshot.snapshot_date >= start_date, MetricSnapshot.snapshot_date <= end_date)
    else:
        d = days or 30
        since = date.today() - timedelta(days=max(d, 1))
        query = query.filter(MetricSnapshot.snapshot_date >= since)
        
    rows = query.order_by(MetricSnapshot.snapshot_date.asc()).all()

    return [
        {
            "date": str(r.snapshot_date),
            "followers": r.followers,
            "follows": r.follows,
            "media_count": r.media_count,
            "reach": r.reach,
            "impressions": r.impressions,
            "profile_views": r.profile_views,
            "website_clicks": r.website_clicks,
            "phone_call_clicks": r.phone_call_clicks,
            "email_contacts": r.email_contacts,
            "get_directions_clicks": r.get_directions_clicks,
            "text_message_clicks": r.text_message_clicks,
        }
        for r in rows
    ]


@router.get("/summary")
def report_summary(
    client_id: int, 
    days: Optional[int] = None, 
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if start_date and end_date:
        period_days = (end_date - start_date).days + 1
        prev_end = start_date - timedelta(days=1)
        prev_start = prev_end - timedelta(days=period_days - 1)
        
        current_rows = list_snapshots(client_id, start_date=start_date, end_date=end_date, current=current, db=db)
        previous_rows = list_snapshots(client_id, start_date=prev_start, end_date=prev_end, current=current, db=db)
    else:
        d = days or 30
        current_rows = list_snapshots(client_id, days=d, current=current, db=db)
        previous_rows = list_snapshots(client_id, days=d*2, current=current, db=db)
        # Filter previous_rows to exclude the current period
        cutoff = date.today() - timedelta(days=d)
        previous_rows = [r for r in previous_rows if date.fromisoformat(r["date"]) <= cutoff]
        period_days = d

    if not current_rows:
        return {"period_days": period_days, "total_snapshots": 0, "latest": None, "deltas": {}, "totals": {}}

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

    curr_web = sum_metric(current_rows, "website_clicks")
    prev_web = sum_metric(previous_rows, "website_clicks")

    curr_phone = sum_metric(current_rows, "phone_call_clicks")
    prev_phone = sum_metric(previous_rows, "phone_call_clicks")

    curr_email = sum_metric(current_rows, "email_contacts")
    prev_email = sum_metric(previous_rows, "email_contacts")

    curr_dir = sum_metric(current_rows, "get_directions_clicks")
    prev_dir = sum_metric(previous_rows, "get_directions_clicks")

    curr_text = sum_metric(current_rows, "text_message_clicks")
    prev_text = sum_metric(previous_rows, "text_message_clicks")

    def calc_pct(curr, prev):
        if prev == 0: return 0
        return round(((curr - prev) / prev) * 100, 2)

    deltas = {
        "followers": calc_pct(latest.get("followers") or 0, last_previous.get("followers") or 0),
        "reach": calc_pct(curr_reach, prev_reach),
        "impressions": calc_pct(curr_imp, prev_imp),
        "profile_views": calc_pct(curr_views, prev_views),
        "website_clicks": calc_pct(curr_web, prev_web),
        "phone_call_clicks": calc_pct(curr_phone, prev_phone),
        "email_contacts": calc_pct(curr_email, prev_email),
        "get_directions_clicks": calc_pct(curr_dir, prev_dir),
        "text_message_clicks": calc_pct(curr_text, prev_text)
    }
    
    totals = {
        "reach": curr_reach,
        "impressions": curr_imp,
        "profile_views": curr_views,
        "prev_reach": prev_reach,
        "prev_impressions": prev_imp,
        "prev_profile_views": prev_views,
        "website_clicks": curr_web,
        "phone_call_clicks": curr_phone,
        "email_contacts": curr_email,
        "get_directions_clicks": curr_dir,
        "text_message_clicks": curr_text,
        "prev_website_clicks": prev_web,
        "prev_phone_call_clicks": prev_phone,
        "prev_email_contacts": prev_email,
        "prev_get_directions_clicks": prev_dir,
        "prev_text_message_clicks": prev_text,
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

class SaveReportHistory(BaseModel):
    client_id: int
    report_type: str
    period_days: int
    objective: str | None = None
    ad_account_id: str | None = None
    campaign_ids: list[str] | None = None

@router.post("/history")
def save_report_history(
    data: SaveReportHistory,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _check_client_access(db, data.client_id, current)
    
    history = ReportHistory(
        client_id=data.client_id,
        user_id=current.id,
        report_type=data.report_type,
        period_days=data.period_days,
        objective=data.objective,
        ad_account_id=data.ad_account_id,
        campaign_ids=json.dumps(data.campaign_ids) if data.campaign_ids else None
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    return {"ok": True, "id": history.id}

@router.get("/history")
def list_report_history(
    client_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _check_client_access(db, client_id, current)
    
    rows = (
        db.query(ReportHistory)
        .filter(ReportHistory.client_id == client_id)
        .order_by(ReportHistory.created_at.desc())
        .limit(20)
        .all()
    )
    
    return [
        {
            "id": r.id,
            "report_type": r.report_type,
            "period_days": r.period_days,
            "objective": r.objective,
            "ad_account_id": r.ad_account_id,
            "campaign_ids": json.loads(r.campaign_ids) if r.campaign_ids else [],
            "created_at": r.created_at.isoformat()
        }
        for r in rows
    ]
