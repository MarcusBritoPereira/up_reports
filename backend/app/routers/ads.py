import httpx
from fastapi import APIRouter, HTTPException
from app.config import META_PAGE_ID, META_ACCESS_TOKEN, META_BASE_URL

router = APIRouter()

@router.get("/campaigns")
async def get_campaigns():
    url = f"{META_BASE_URL}/act_{META_PAGE_ID}/campaigns"
    params = {
        "fields": "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time",
        "access_token": META_ACCESS_TOKEN
    }
    async with httpx.AsyncClient() as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.json())
        return r.json()