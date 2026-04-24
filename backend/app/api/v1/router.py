from fastapi import APIRouter
from app.routers import instagram, ads, clients, auth, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(instagram.router, prefix="/instagram", tags=["Instagram"])
api_router.include_router(ads.router, prefix="/ads", tags=["Ads"])
api_router.include_router(clients.router, prefix="/clients", tags=["Clients"])
