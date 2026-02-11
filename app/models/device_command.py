from pydantic import BaseModel
from typing import Dict, Any

class DeviceCommand(BaseModel):
    """Schema per inviare comandi a un device"""
    command: str
    params: Dict[str, Any]
