from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FileBase(BaseModel):
    """Schema base per i file"""
    name: str
    path: str
    size: int
    mime_type: Optional[str] = None


class FileCreate(FileBase):
    """Schema per creare un file"""
    pass


class FileResponse(FileBase):
    """Schema per la risposta con file info"""
    id: str
    user_id: str
    storage_path: str
    checksum: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class FileUploadResponse(BaseModel):
    """Schema per la risposta dopo upload"""
    file_id: str
    name: str
    size: int
    url: str
