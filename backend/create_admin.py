import sys
import os
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models import User
from app.core.security import hash_password

def create_admin():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@upreports.com").first()
        if not admin:
            admin = User(
                name="Administrador",
                email="admin@upreports.com",
                password_hash=hash_password("admin123"),
                role="admin",
                is_active=True
            )
            db.add(admin)
            db.commit()
            print("Admin user created: admin@upreports.com / admin123")
        else:
            print("Admin user already exists")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
