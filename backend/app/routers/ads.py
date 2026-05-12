import httpx
import json
from datetime import date, timedelta
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional, List

from app.config import META_PAGE_ID, META_ACCESS_TOKEN, META_BASE_URL
from app.dependencies import require_roles, get_current_user
from app.models import User, Client, UserClientAccess
from app.database import get_db
from app.core.secrets import decrypt_secret

router = APIRouter()

def get_ads_creds(client_id: Optional[int], current: User, db: Session, ad_account_id_override: Optional[str] = None):
    if client_id:
        c = db.query(Client).filter(Client.id == client_id).first()
        if not c:
            raise HTTPException(status_code=404, detail="Cliente não encontrado")

        if current.role != "admin":
            allowed = (
                db.query(UserClientAccess)
                .filter(UserClientAccess.user_id == current.id, UserClientAccess.client_id == c.id)
                .first()
            )
            if not allowed:
                raise HTTPException(status_code=403, detail="Usuário sem acesso a este cliente")

        final_ad_id = ad_account_id_override or c.ad_account_id
        
        if not final_ad_id:
            return None, decrypt_secret(c.access_token)
            
        return final_ad_id, decrypt_secret(c.access_token)

    if current.role != "admin":
        raise HTTPException(status_code=400, detail="client_id é obrigatório para este perfil")
    return META_PAGE_ID, META_ACCESS_TOKEN


@router.get("/accounts")
async def get_ad_accounts(
    client_id: int | None = None,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _, token = get_ads_creds(client_id, current, db)
    
    url = f"{META_BASE_URL}/me/adaccounts"
    params = {
        "fields": "id,name,account_id,account_status,currency",
        "access_token": token,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.json())
        return r.json()


@router.get("/campaigns")
async def get_campaigns(
    client_id: Optional[int] = None,
    ad_account_id: Optional[str] = None,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ad_account_id, token = get_ads_creds(client_id, current, db, ad_account_id)
    if not ad_account_id:
        return {"data": []}
    
    prefix = "" if ad_account_id.startswith("act_") else "act_"
    url = f"{META_BASE_URL}/{prefix}{ad_account_id}/campaigns"
    params = {
        "fields": "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time",
        "effective_status": '["ACTIVE"]',
        "access_token": token,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.json())
        return r.json()

@router.get("/insights")
async def get_ads_insights(
    client_id: Optional[int] = None,
    ad_account_id: Optional[str] = None,
    campaign_ids: Optional[str] = None,
    days: int = 30,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ad_account_id, token = get_ads_creds(client_id, current, db, ad_account_id)
    if not ad_account_id:
        return {"data": [{"reach": 0, "impressions": 0, "spend": 0, "clicks": 0, "ctr": 0, "cpc": 0, "actions": []}]}
    
    prefix = "" if ad_account_id.startswith("act_") else "act_"
    url = f"{META_BASE_URL}/{prefix}{ad_account_id}/insights"
    
    since_date = (date.today() - timedelta(days=days)).strftime("%Y-%m-%d")
    until_date = date.today().strftime("%Y-%m-%d")
    time_range = {"since": since_date, "until": until_date}

    params = {
        "fields": "reach,impressions,spend,clicks,ctr,cpc,actions",
        "time_range": json.dumps(time_range),
        "access_token": token,
    }
    
    if campaign_ids:
        filtering = [{"field": "campaign.id", "operator": "IN", "value": campaign_ids.split(",")}]
        params["filtering"] = json.dumps(filtering)

    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            return {"data": [{"reach": 0, "impressions": 0, "spend": 0, "clicks": 0, "ctr": 0, "cpc": 0, "actions": []}], "error": r.json()}
        return r.json()

@router.get("/creatives")
async def get_ad_creatives_insights(
    client_id: Optional[int] = None,
    ad_account_id: Optional[str] = None,
    campaign_ids: Optional[str] = None,
    days: int = 30,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ad_account_id, token = get_ads_creds(client_id, current, db, ad_account_id)
    if not ad_account_id:
        return {"data": []}
    
    prefix = "" if ad_account_id.startswith("act_") else "act_"
    url = f"{META_BASE_URL}/{prefix}{ad_account_id}/insights"
    
    since_date = (date.today() - timedelta(days=days)).strftime("%Y-%m-%d")
    until_date = date.today().strftime("%Y-%m-%d")
    time_range = {"since": since_date, "until": until_date}

    params = {
        "fields": "ad_id,ad_name,reach,impressions,spend,clicks,ctr,cpc,actions",
        "level": "ad",
        "time_range": json.dumps(time_range),
        "access_token": token,
        "limit": 50
    }
    
    if campaign_ids:
        filtering = [{"field": "campaign.id", "operator": "IN", "value": campaign_ids.split(",")}]
        params["filtering"] = json.dumps(filtering)

    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            return {"data": [], "error": r.json()}
        
        data = r.json().get("data", [])
        if not data:
            return {"data": []}

        # Fetch creative details for these ads
        ad_ids = [item["ad_id"] for item in data]
        # Limit to first 50 to avoid huge requests (already limited by params)
        
        ads_details_params = {
            "ids": ",".join(ad_ids),
            "fields": "id,creative{id,thumbnail_url,effective_object_story_id}",
            "access_token": token
        }
        details_r = await client.get(f"{META_BASE_URL}", params=ads_details_params)
        
        details_map = {}
        if details_r.status_code == 200:
            details_map = details_r.json()

        for item in data:
            ad_id = item["ad_id"]
            details = details_map.get(ad_id, {})
            creative = details.get("creative", {})
            item["thumbnail_url"] = creative.get("thumbnail_url")
            
            # Construct a preview link if possible
            story_id = creative.get("effective_object_story_id")
            if story_id:
                # Common format for facebook/instagram posts
                item["permalink_url"] = f"https://facebook.com/{story_id}"
            else:
                item["permalink_url"] = None

        return {"data": data}
