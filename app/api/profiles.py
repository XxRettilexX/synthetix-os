from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from typing import Dict, Any

from app.core.deps import get_supabase, get_current_user

router = APIRouter()

@router.get("/me")
async def get_my_profile(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Restituisce il profilo dell'utente corrente"""
    try:
        # In Supabase i profili sono spesso in una tabella separata 'profiles'
        # ma se non esiste, usiamo i dati dal token
        result = supabase.table("profiles").select("*").eq("id", current_user.id).execute()
        
        if result.data:
            return result.data[0]
        
        # Fallback basato sui dati dell'auth
        return {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.user_metadata.get("full_name", ""),
            "avatar_url": current_user.user_metadata.get("avatar_url", "")
        }
    except Exception as e:
        # Se la tabella non esiste o errore, torniamo dati base dall'auth
        return {
            "id": current_user.id,
            "email": current_user.email
        }

@router.patch("/me")
async def update_my_profile(
    updates: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Aggiorna il profilo dell'utente corrente"""
    try:
        # Aggiorna (o crea se non esiste) nella tabella profiles
        # Usiamo upsert per gestire entrambi i casi
        data = {**updates, "id": current_user.id}
        result = supabase.table("profiles").upsert(data).execute()
        
        # Opzionalmente aggiorna anche i metadata dell'auth
        # supabase.auth.update_user({"data": updates})
        
        return result.data[0] if result.data else updates
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating profile: {str(e)}"
        )
