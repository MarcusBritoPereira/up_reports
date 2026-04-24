from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    page_id = Column(String, nullable=False)
    ig_id = Column(String, nullable=False)
    access_token = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_access = relationship("UserClientAccess", back_populates="client", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="social_media")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    client_access = relationship("UserClientAccess", back_populates="user", cascade="all, delete-orphan")


class UserClientAccess(Base):
    __tablename__ = "user_client_access"
    __table_args__ = (UniqueConstraint("user_id", "client_id", name="uq_user_client"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="client_access")
    client = relationship("Client", back_populates="user_access")
