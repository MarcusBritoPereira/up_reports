from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    page_id = Column(String, nullable=False)
    ig_id = Column(String, nullable=False)
    access_token = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)