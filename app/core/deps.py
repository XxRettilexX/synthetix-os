"""Dependencies for dependency injection"""
from fastapi import HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from redis import Redis
import logging

from app.core.config import settings

# Globals che verranno inizializzati nel main
supabase_client: Client = None
local_db_engine = None
redis_client: Redis = None
security = HTTPBearer()
logger = logging.getLogger(__name__)

def get_supabase() -> Client:
    """Dependency injection per Supabase client"""
    if supabase_client is None:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    return supabase_client


def get_local_db():
    """Dependency injection per local PostgreSQL"""
    if local_db_engine is None:
        raise HTTPException(status_code=500, detail="Local database not initialized")
    return local_db_engine


def get_redis() -> Redis:
    """Dependency injection per Redis client"""
    if redis_client is None:
        raise HTTPException(status_code=503, detail="Redis not available")
    return redis_client


async def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase)
) -> dict:
    """
    Verifica il token JWT tramite Supabase e restituisce l'utente.
    Inietta questo nelle rotte protette.
    """
    try:
        # Supabase client got_user() verifica il token locale o remoto
        user = supabase.auth.get_user(token.credentials)
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
            
        return user.user
    except Exception as e:
        logger.error(f"Auth error: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
