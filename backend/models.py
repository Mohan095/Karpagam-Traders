from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

# ==========================================
# Pydantic Schemas (Request/Response Validation)
# ==========================================

class OrderRequest(BaseModel):
    """Schema for placing orders and submitting inquiries."""
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=7, max_length=25)
    email: Optional[str] = ""
    service: str = Field(..., min_length=2, max_length=100)
    message: str = Field(..., min_length=1)
    status: Optional[str] = "Pending"
    total_amount: Optional[float] = 0.0


class ContactFormSubmit(BaseModel):
    """Schema for validating submitted contact inquiries."""
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=7, max_length=25)
    service: str = Field(..., min_length=2, max_length=100)
    message: str = Field(..., min_length=1)
    email: Optional[str] = ""


class AdminLogin(BaseModel):
    """Schema for receiving login credentials."""
    username: str
    password: str


class NotificationItem(BaseModel):
    """Schema for admin notifications and daily news."""
    id: Optional[str] = None
    title: str = Field(..., min_length=2)
    content: str = Field(..., min_length=2)
    category: Optional[str] = "Daily News"
    image: Optional[str] = ""
    is_pinned: Optional[bool] = False
    is_active: Optional[bool] = True
    date: Optional[str] = ""


class TokenResponse(BaseModel):
    """Schema for login response containing JWT access token."""
    access_token: str
    token_type: str
