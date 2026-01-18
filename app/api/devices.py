from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from supabase import Client
from datetime import datetime

from app.main import get_supabase
from app.models.device import DeviceCreate, DeviceUpdate, DeviceResponse

router = APIRouter()


@router.get("/", response_model=List[DeviceResponse])
async def list_devices(
    supabase: Client = Depends(get_supabase)
):
    """Lista tutti i device dell'utente corrente"""
    try:
        # TODO: Implementare autenticazione e ottenere user_id dal token
        result = supabase.table("devices").select("*").execute()
        return result.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching devices: {str(e)}"
        )


@router.post("/", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def create_device(
    device: DeviceCreate,
    supabase: Client = Depends(get_supabase)
):
    """Crea un nuovo device"""
    try:
        # TODO: Ottenere user_id dal token di autenticazione
        device_data = device.model_dump()
        device_data["user_id"] = "temp-user-id"  # Placeholder
        device_data["created_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("devices").insert(device_data).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating device: {str(e)}"
        )


@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(
    device_id: str,
    supabase: Client = Depends(get_supabase)
):
    """Ottieni un device specifico"""
    try:
        result = supabase.table("devices").select("*").eq("id", device_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Device {device_id} not found"
            )
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching device: {str(e)}"
        )


@router.patch("/{device_id}", response_model=DeviceResponse)
async def update_device(
    device_id: str,
    device_update: DeviceUpdate,
    supabase: Client = Depends(get_supabase)
):
    """Aggiorna un device esistente"""
    try:
        update_data = device_update.model_dump(exclude_unset=True)
        update_data["last_seen"] = datetime.utcnow().isoformat()
        
        result = supabase.table("devices").update(update_data).eq("id", device_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Device {device_id} not found"
            )
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating device: {str(e)}"
        )


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device(
    device_id: str,
    supabase: Client = Depends(get_supabase)
):
    """Elimina un device"""
    try:
        result = supabase.table("devices").delete().eq("id", device_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Device {device_id} not found"
            )
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting device: {str(e)}"
        )
