from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from .database import Base
from datetime import datetime
from sqlalchemy import  ForeignKey, DateTime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_verified = Column(Boolean, default=False)
    otp_code = Column(String, nullable=True)
    otp_expiry = Column(DateTime, nullable=True)
    otp_attempts = Column(Integer, default=0)
    otp_locked_until = Column(DateTime, nullable=True)
    last_otp_sent = Column(DateTime, nullable=True)

class Contact(Base):
    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(100))
    message = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

# NEW: Cache table for RCSB protein metadata
class ProteinCache(Base):
    __tablename__ = "protein_cache"

    id = Column(Integer, primary_key=True, index=True)
    pdb_id = Column(String(10), unique=True, index=True, nullable=False)
    metadata_json = Column(Text, nullable=False)       # Full RCSB JSON response
    cached_at = Column(DateTime, default=datetime.utcnow)
