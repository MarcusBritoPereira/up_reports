import asyncio
from app.core.secrets import decrypt_secret
from app.database import SessionLocal
from app.models import Client
from app.core.config import settings
import httpx

async def fix():
    db = SessionLocal()
    c = db.query(Client).get(2)
    if not c:
        print("Client 2 not found")
        return
    token = decrypt_secret(c.access_token)
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{settings.meta_base_url}/{c.ig_id}", 
            params={'fields': 'profile_picture_url', 'access_token': token}
        )
        if r.status_code == 200:
            url = r.json().get('profile_picture_url')
            c.profile_picture_url = url
            db.commit()
            print(f"Updated profile picture: {url}")
        else:
            print(f"Error: {r.text}")

if __name__ == "__main__":
    asyncio.run(fix())
