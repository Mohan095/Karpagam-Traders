from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel, Field

Base = declarative_base()

# ==========================================
# SQLAlchemy Models (Database Tables)
# ==========================================

class DBAdmin(Base):
    """Admin credentials table."""
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(100), nullable=False)

class DBMessage(Base):
    """Customer inquiries table."""
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    service = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# ==========================================
# Pydantic Schemas (Request/Response Validation)
# ==========================================

class ContactFormSubmit(BaseModel):
    """Schema for validating submitted contact inquiries."""
    name: str = Field(..., min_length=2, max_length=100, description="Customer name")
    phone: str = Field(..., min_length=10, max_length=15, pattern=r"^\+?[0-9\s\-]+$", description="Customer phone number")
    service: str = Field(..., min_length=3, max_length=100, description="Inquired service type")
    message: str = Field(..., min_length=5, description="Message content")

class ContactResponse(BaseModel):
    """Schema for returning message list records."""
    id: int
    name: str
    phone: str
    service: str
    message: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class AdminLogin(BaseModel):
    """Schema for receiving login credentials."""
    username: str
    password: str

class TokenResponse(BaseModel):
    """Schema for login response containing JWT access token."""
    access_token: str
    token_type: str
