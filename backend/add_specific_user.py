import sys
import os
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models import User
from app.core.security import hash_password

def add_user(email, name):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                name=name,
                email=email,
                password_hash=hash_password("admin123"),
                role="admin",
                is_active=True
            )
            db.add(user)
            db.commit()
            print(f"User created: {email} / admin123")
        else:
            print(f"User {email} already exists")
    finally:
        db.close()

if __name__ == "__main__":
    add_user("marcusrodrigo2@gmail.com", "Marcus Rodrigo")
