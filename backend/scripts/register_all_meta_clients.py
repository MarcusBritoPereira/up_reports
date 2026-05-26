import sys
import os
import json
import logging
import httpx

sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models import Client, OAuthSession, User, UserClientAccess
from app.core.secrets import decrypt_secret, encrypt_secret
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("register_all_meta_clients")

async def register_all():
    db = SessionLocal()
    try:
        # 1. Get the admin user
        admin = db.query(User).filter(User.email == "admin@upreports.com").first()
        if not admin:
            logger.error("Admin user not found.")
            return

        # 2. Get the latest completed/pending selection OAuthSession
        session = (
            db.query(OAuthSession)
            .filter(OAuthSession.user_id == admin.id)
            .order_by(OAuthSession.id.desc())
            .first()
        )
        if not session or not session.pages_json:
            logger.error("No OAuthSession found with pages.")
            return

        token = decrypt_secret(session.token_encrypted or "")
        if not token:
            logger.error("Failed to decrypt access token from session.")
            return

        pages = json.loads(session.pages_json)
        logger.info(f"Found {len(pages)} pages in the last OAuth session.")

        registered_count = 0
        updated_count = 0

        async with httpx.AsyncClient(timeout=15) as client:
            for p in pages:
                page_id = p.get("id")
                page_name = p.get("name")
                ig_account = p.get("ig")
                ad_accounts = p.get("ad_accounts", [])

                if not ig_account or not ig_account.get("id"):
                    logger.info(f"Skipping page '{page_name}' - No Instagram Business Account connected.")
                    continue

                ig_id = ig_account["id"]
                ad_account_id = ad_accounts[0].get("id") if ad_accounts else None

                # Fetch IG profile picture
                pic_url = None
                try:
                    pic_resp = await client.get(
                        f"{settings.meta_base_url}/{ig_id}",
                        params={"fields": "profile_picture_url", "access_token": token},
                    )
                    if pic_resp.status_code == 200:
                        pic_url = pic_resp.json().get("profile_picture_url")
                except Exception as e:
                    logger.error(f"Failed to fetch picture for {page_name}: {e}")

                existing = db.query(Client).filter(Client.page_id == page_id).first()
                if existing:
                    existing.name = page_name
                    existing.ig_id = ig_id
                    existing.ad_account_id = ad_account_id
                    existing.access_token = encrypt_secret(token)
                    if pic_url:
                        existing.profile_picture_url = pic_url
                    db.commit()
                    db.refresh(existing)
                    client_row = existing
                    updated_count += 1
                    logger.info(f"Updated existing client: {page_name} (IG: @{ig_account.get('username')})")
                else:
                    client_row = Client(
                        name=page_name,
                        page_id=page_id,
                        ig_id=ig_id,
                        ad_account_id=ad_account_id,
                        access_token=encrypt_secret(token),
                        profile_picture_url=pic_url
                    )
                    db.add(client_row)
                    db.commit()
                    db.refresh(client_row)
                    registered_count += 1
                    logger.info(f"Registered new client: {page_name} (IG: @{ig_account.get('username')})")

                # Grant access to Admin user
                access = (
                    db.query(UserClientAccess)
                    .filter(UserClientAccess.user_id == admin.id, UserClientAccess.client_id == client_row.id)
                    .first()
                )
                if not access:
                    db.add(UserClientAccess(user_id=admin.id, client_id=client_row.id))
                    db.commit()

        logger.info(f"Registration finished. Registered: {registered_count}, Updated: {updated_count} clients.")
        print(f"SUCCESS: Registered {registered_count} and updated {updated_count} clients successfully!")

    except Exception as e:
        logger.error(f"Error during registration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import asyncio
    asyncio.run(register_all())
