import sys
import os
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models import Client, User, UserClientAccess
from app.core.secrets import encrypt_secret

def create_mock():
    db = SessionLocal()
    try:
        # Get the admin user we created
        admin = db.query(User).filter(User.email == "admin@upreports.com").first()
        if not admin:
            print("Admin user not found. Run create_admin.py first.")
            return

        # Check if mock client already exists
        mock = db.query(Client).filter(Client.name == "Projeto Exemplo (Mock)").first()
        if not mock:
            mock = Client(
                name="Projeto Exemplo (Mock)",
                page_id="123456789",
                ig_id="987654321",
                ad_account_id="act_123456789",
                access_token=encrypt_secret("mock_token_123")
            )
            db.add(mock)
            db.commit()
            db.refresh(mock)
            
            # Grant access to admin
            access = UserClientAccess(user_id=admin.id, client_id=mock.id)
            db.add(access)
            db.commit()
            print(f"Mock project created: {mock.name}")
        else:
            print("Mock project already exists")
    finally:
        db.close()

if __name__ == "__main__":
    create_mock()
