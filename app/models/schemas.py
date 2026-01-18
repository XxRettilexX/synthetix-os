from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

# --- Auth Schemas ---
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(UserLogin):
    username: Optional[str] = None
    full_name: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

# --- Device Schemas ---
class DeviceBase(BaseModel):
    name: str
    device_type: str = "GENERIC"
    state: Dict[str, Any] = Field(default_factory=dict)

class DeviceCreate(DeviceBase):
    pass

class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    state: Optional[Dict[str, Any]] = None

class DeviceStateUpdate(BaseModel):
    """Schema specifico per aggiornare solo lo stato (es. accendere luce)"""
    state: Dict[str, Any]

class DeviceResponse(DeviceBase):
    id: UUID
    user_id: UUID
    last_seen: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
