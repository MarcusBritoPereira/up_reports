import httpx
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.config import META_PAGE_ID, META_ACCESS_TOKEN, META_BASE_URL
from app.database import get_db
from app.models import Client

router = APIRouter()


def get_ads_creds(client_id: int | None, db: Session):
    if client_id:
        c = db.query(Client).filter(Client.id == client_id).first()
        if not c:
            raise HTTPException(status_code=404, detail="Cliente não encontrado")
        return c.page_id, c.access_token
    return META_PAGE_ID, META_ACCESS_TOKEN


async def fetch_ads_insights(ad_account_id: str, token: str, days: int):
    url = f"{META_BASE_URL}/act_{ad_account_id}/insights"
    params = {
        "level": "campaign",
        "date_preset": f"last_{days}d",
        "fields": "campaign_id,campaign_name,spend,impressions,reach,clicks,cpc,cpm,ctr,actions,date_start,date_stop",
        "access_token": token,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.json())
        return r.json().get("data", [])


@router.get("/campaigns")
async def get_campaigns(client_id: int | None = None, db: Session = Depends(get_db)):
    ad_account_id, token = get_ads_creds(client_id, db)
    url = f"{META_BASE_URL}/act_{ad_account_id}/campaigns"
    params = {
        "fields": "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time",
        "access_token": token,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.json())
        return r.json()


@router.get("/report")
async def get_ads_report(
    client_id: int | None = None,
    days: int = 30,
    db: Session = Depends(get_db),
):
    if days not in (7, 14, 30, 90):
        raise HTTPException(status_code=400, detail="days deve ser 7, 14, 30 ou 90")

    ad_account_id, token = get_ads_creds(client_id, db)
    rows = await fetch_ads_insights(ad_account_id, token, days)

    campaigns = []
    totals = {
        "spend": 0.0,
        "impressions": 0,
        "reach": 0,
        "clicks": 0,
        "conversions": 0.0,
    }

    for row in rows:
        spend = float(row.get("spend") or 0)
        impressions = int(row.get("impressions") or 0)
        reach = int(row.get("reach") or 0)
        clicks = int(row.get("clicks") or 0)
        cpc = float(row.get("cpc") or 0)
        cpm = float(row.get("cpm") or 0)
        ctr = float(row.get("ctr") or 0)

        conversions = 0.0
        for action in row.get("actions", []):
            if action.get("action_type") in {
                "offsite_conversion",
                "purchase",
                "lead",
                "onsite_conversion.purchase",
                "onsite_conversion.lead_grouped",
            }:
                conversions += float(action.get("value") or 0)

        totals["spend"] += spend
        totals["impressions"] += impressions
        totals["reach"] += reach
        totals["clicks"] += clicks
        totals["conversions"] += conversions

        campaigns.append(
            {
                "campaign_id": row.get("campaign_id"),
                "campaign_name": row.get("campaign_name"),
                "date_start": row.get("date_start"),
                "date_stop": row.get("date_stop"),
                "spend": spend,
                "impressions": impressions,
                "reach": reach,
                "clicks": clicks,
                "ctr": ctr,
                "cpc": cpc,
                "cpm": cpm,
                "conversions": conversions,
            }
        )

    ctr_total = (totals["clicks"] / totals["impressions"] * 100) if totals["impressions"] else 0
    cpc_total = (totals["spend"] / totals["clicks"]) if totals["clicks"] else 0
    cpm_total = (totals["spend"] / totals["impressions"] * 1000) if totals["impressions"] else 0
    cpa_total = (totals["spend"] / totals["conversions"]) if totals["conversions"] else 0

    campaigns.sort(key=lambda x: x["spend"], reverse=True)

    return {
        "period_days": days,
        "summary": {
            "spend": round(totals["spend"], 2),
            "impressions": totals["impressions"],
            "reach": totals["reach"],
            "clicks": totals["clicks"],
            "conversions": round(totals["conversions"], 2),
            "ctr": round(ctr_total, 2),
            "cpc": round(cpc_total, 2),
            "cpm": round(cpm_total, 2),
            "cpa": round(cpa_total, 2),
        },
        "campaigns": campaigns,
    }
