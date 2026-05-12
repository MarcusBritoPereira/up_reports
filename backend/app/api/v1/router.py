from fastapi import APIRouter
from app.routers import instagram, ads, clients, auth, users, oauth, reports, whatsapp

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(oauth.router, prefix="/oauth", tags=["OAuth"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(instagram.router, prefix="/instagram", tags=["Instagram"])
api_router.include_router(ads.router, prefix="/ads", tags=["Ads"])
api_router.include_router(clients.router, prefix="/clients", tags=["Clients"])
api_router.include_router(whatsapp.router, prefix="/whatsapp", tags=["WhatsApp"])
