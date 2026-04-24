import httpx
from fastapi import APIRouter, HTTPException, Depends

from app.config import META_PAGE_ID, META_ACCESS_TOKEN, META_BASE_URL
from app.dependencies import require_roles
from app.models import User

router = APIRouter()


@router.get("/campaigns")
async def get_campaigns(_: User = Depends(require_roles("admin"))):
    url = f"{META_BASE_URL}/act_{META_PAGE_ID}/campaigns"
    params = {
        "fields": "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time",
        "access_token": META_ACCESS_TOKEN,
    }
    async with httpx.AsyncClient() as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.json())
        return r.json()
