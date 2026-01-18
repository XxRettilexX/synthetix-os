from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class DeviceBase(BaseModel):
    """Schema base per i device"""
    name: str
    device_type: Optional[str] = None
    state: Optional[Dict[str, Any]] = Field(default_factory=dict)


class DeviceCreate(DeviceBase):
    """Schema per creare un device"""
    pass


class DeviceUpdate(BaseModel):
    """Schema per aggiornare un device"""
    name: Optional[str] = None
    device_type: Optional[str] = None
    state: Optional[Dict[str, Any]] = None


class DeviceResponse(DeviceBase):
    """Schema per la risposta con device info"""
    id: str
    user_id: str
    last_seen: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class DeviceLog(BaseModel):
    """Schema per i log dei device (DB locale)"""
    device_id: str
    event_type: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
