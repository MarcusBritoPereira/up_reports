from datetime import datetime

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    page_id = Column(String, nullable=False)
    ig_id = Column(String, nullable=False)
    ad_account_id = Column(String, nullable=True)
    access_token = Column(String, nullable=False)
    profile_picture_url = Column(String, nullable=True)
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


class RevokedToken(Base):
    __tablename__ = "revoked_tokens"

    id = Column(Integer, primary_key=True, index=True)
    jti = Column(String, nullable=False, unique=True, index=True)
    token_type = Column(String, nullable=False)
    revoked_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)


class OAuthSession(Base):
    __tablename__ = "oauth_sessions"

    id = Column(Integer, primary_key=True, index=True)
    state = Column(String, nullable=False, unique=True, index=True)
    oauth_session = Column(String, nullable=True, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String, nullable=False)
    client_name = Column(String, nullable=False)
    status = Column(String, nullable=False, default="started")
    token_encrypted = Column(Text, nullable=True)
    pages_json = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class MetricSnapshot(Base):
    __tablename__ = "metric_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    snapshot_date = Column(Date, nullable=False, index=True)
    followers = Column(Integer, nullable=True)
    follows = Column(Integer, nullable=True)
    media_count = Column(Integer, nullable=True)
    reach = Column(Integer, nullable=True)
    impressions = Column(Integer, nullable=True)
    profile_views = Column(Integer, nullable=True)
    website_clicks = Column(Integer, nullable=True, default=0)
    phone_call_clicks = Column(Integer, nullable=True, default=0)
    email_contacts = Column(Integer, nullable=True, default=0)
    get_directions_clicks = Column(Integer, nullable=True, default=0)
    text_message_clicks = Column(Integer, nullable=True, default=0)
    raw_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    action = Column(String, nullable=False, index=True)
    details = Column(Text, nullable=True)
    request_id = Column(String, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class StoryArchive(Base):
    __tablename__ = "story_archive"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    story_id = Column(String, nullable=False, unique=True, index=True)
    media_url = Column(String, nullable=True)
    timestamp = Column(DateTime, nullable=False)
    
    reach = Column(Integer, default=0)
    impressions = Column(Integer, default=0)
    replies = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    profile_visits = Column(Integer, default=0)
    taps_forward = Column(Integer, default=0)
    taps_back = Column(Integer, default=0)
    exits = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class AudienceArchive(Base):
    __tablename__ = "audience_archive"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    snapshot_date = Column(Date, nullable=False, index=True)
    gender_age_json = Column(Text, nullable=True)
    city_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class MediaArchive(Base):
    __tablename__ = "media_archive"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    media_id = Column(String, nullable=False, index=True)
    snapshot_date = Column(Date, nullable=False, index=True)
    
    caption = Column(Text, nullable=True)
    media_type = Column(String, nullable=True)
    permalink = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    timestamp = Column(DateTime, nullable=True)
    
    like_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    reach = Column(Integer, default=0)
    impressions = Column(Integer, default=0)
    saved = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    plays = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)

class ReportHistory(Base):
    __tablename__ = "report_history"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    report_type = Column(String, nullable=False)
    period_days = Column(Integer, nullable=False)
    objective = Column(String, nullable=True)
    ad_account_id = Column(String, nullable=True)
    campaign_ids = Column(Text, nullable=True) # Stored as JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
