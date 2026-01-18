from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List
from supabase import Client
from datetime import datetime
import hashlib
import os

from app.core.deps import get_supabase
from app.models.file import FileCreate, FileResponse, FileUploadResponse

router = APIRouter()

STORAGE_PATH = "/app/storage"


@router.get("/", response_model=List[FileResponse])
async def list_files(
    supabase: Client = Depends(get_supabase)
):
    """Lista tutti i file dell'utente corrente"""
    try:
        # TODO: Implementare autenticazione e filtrare per user_id
        result = supabase.table("files").select("*").execute()
        return result.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching files: {str(e)}"
        )


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    supabase: Client = Depends(get_supabase)
):
    """Upload di un file nel personal cloud"""
    try:
        # Leggi il contenuto del file
        contents = await file.read()
        file_size = len(contents)
        
        # Calcola checksum
        checksum = hashlib.sha256(contents).hexdigest()
        
        # TODO: Ottenere user_id dal token
        user_id = "00000000-0000-0000-0000-000000000000"
        
        # Salva il file localmente (simula cloud storage)
        os.makedirs(f"{STORAGE_PATH}/{user_id}", exist_ok=True)
        storage_path = f"{STORAGE_PATH}/{user_id}/{checksum}_{file.filename}"
        
        with open(storage_path, "wb") as f:
            f.write(contents)
        
        # Registra il file in Supabase
        file_data = {
            "user_id": user_id,
            "name": file.filename,
            "path": f"/{file.filename}",
            "size": file_size,
            "mime_type": file.content_type,
            "storage_path": storage_path,
            "checksum": checksum,
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("files").insert(file_data).execute()
        
        if result.data:
            file_record = result.data[0]
            return FileUploadResponse(
                file_id=file_record["id"],
                name=file.filename,
                size=file_size,
                url=f"/api/files/{file_record['id']}/download"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create file record"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading file: {str(e)}"
        )


@router.get("/{file_id}", response_model=FileResponse)
async def get_file(
    file_id: str,
    supabase: Client = Depends(get_supabase)
):
    """Ottieni informazioni su un file specifico"""
    try:
        result = supabase.table("files").select("*").eq("id", file_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File {file_id} not found"
            )
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching file: {str(e)}"
        )


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: str,
    supabase: Client = Depends(get_supabase)
):
    """Elimina un file"""
    try:
        # Ottieni informazioni sul file per eliminare il file fisico
        result = supabase.table("files").select("*").eq("id", file_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File {file_id} not found"
            )
        
        file_record = result.data[0]
        
        # Elimina il file fisico
        if os.path.exists(file_record["storage_path"]):
            os.remove(file_record["storage_path"])
        
        # Elimina il record dal database
        supabase.table("files").delete().eq("id", file_id).execute()
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting file: {str(e)}"
        )
