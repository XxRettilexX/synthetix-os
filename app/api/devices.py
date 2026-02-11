from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from supabase import Client
from datetime import datetime

from app.core.deps import get_supabase, get_current_user, get_device_manager
from app.core.device_manager import DeviceManager
from app.core.ws_manager import manager as ws_manager
from app.models.device import DeviceCreate, DeviceUpdate, DeviceResponse
from app.models.device_command import DeviceCommand

router = APIRouter()


@router.get("/", response_model=List[DeviceResponse])
async def list_devices(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Lista tutti i device dell'utente corrente"""
    try:
        result = supabase.table("devices").select("*").eq("user_id", current_user.id).execute()
        return result.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching devices: {str(e)}"
        )


@router.post("/", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def create_device(
    device: DeviceCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Crea un nuovo device"""
    try:
        device_data = device.model_dump()
        device_data["user_id"] = current_user.id
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
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
    device_manager: DeviceManager = Depends(get_device_manager)
):
    """Ottieni un device specifico, con stato aggiornato dal driver se disponibile"""
    try:
        result = supabase.table("devices").select("*").eq("id", device_id).eq("user_id", current_user.id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Device {device_id} not found"
            )
        
        device_data = result.data[0]
        
        # Prova a ottenere lo stato real-time dal driver
        real_time_state = await device_manager.get_device_state(device_id)
        if real_time_state:
            device_data["state"] = real_time_state
            
            # Opzionale: aggiorna il DB con l'ultimo stato noto
            # supabase.table("devices").update({"state": real_time_state}).eq("id", device_id).execute()
        
        return device_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching device: {str(e)}"
        )


@router.post("/{device_id}/command", response_model=DeviceResponse)
async def send_command(
    device_id: str,
    command: DeviceCommand,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
    device_manager: DeviceManager = Depends(get_device_manager)
):
    """Invia un comando a un dispositivo"""
    try:
        # Verifica ownership
        result = supabase.table("devices").select("*").eq("id", device_id).eq("user_id", current_user.id).execute()
        if not result.data:
             raise HTTPException(status_code=404, detail="Device not found")
        
        device_record = result.data[0]
        
        # Se il driver non è caricato, prova a caricarlo
        if device_id not in device_manager.drivers:
             # In un caso reale, la config verrebbe dal DB o da un secret manager
             config = device_record.get("state", {})
             device_type = device_record.get("device_type", "virtual_light") # Default fallback
             await device_manager.load_device(device_id, device_type, config)

        # Invia comando
        success = await device_manager.send_command(device_id, command.params)
        
        if not success:
             raise HTTPException(status_code=500, detail="Failed to execute command on device")
             
        # Ottieni stato aggiornato
        new_state = await device_manager.get_device_state(device_id)
        
        # Aggiorna DB
        update_response = supabase.table("devices").update({
            "state": new_state,
            "last_seen": datetime.utcnow().isoformat()
        }).eq("id", device_id).execute()
        
        # Invia notifica real-time via WebSocket
        try:
            await ws_manager.broadcast({
                "event": "device_update",
                "device_id": device_id,
                "state": new_state
            })
        except Exception as e:
            # Non bloccare la chiamata API se il WS fallisce
            pass
        
        return update_response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending command: {str(e)}"
        )


@router.patch("/{device_id}", response_model=DeviceResponse)
async def update_device(
    device_id: str,
    device_update: DeviceUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Aggiorna un device esistente"""
    try:
        update_data = device_update.model_dump(exclude_unset=True)
        update_data["last_seen"] = datetime.utcnow().isoformat()
        
        result = supabase.table("devices").update(update_data).eq("id", device_id).eq("user_id", current_user.id).execute()
        
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
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Elimina un device"""
    try:
        result = supabase.table("devices").delete().eq("id", device_id).eq("user_id", current_user.id).execute()
        
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
