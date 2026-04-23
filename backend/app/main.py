from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import instagram, ads, clients

app = FastAPI(title="Meta Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(instagram.router, prefix="/api/instagram", tags=["Instagram"])
app.include_router(ads.router, prefix="/api/ads", tags=["Ads"])
app.include_router(clients.router, prefix="/api/clients", tags=["Clients"])

@app.get("/")
def root():
    return {"status": "ok"}