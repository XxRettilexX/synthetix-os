"""Dependencies for dependency injection"""
from fastapi import HTTPException
from supabase import Client
from redis import Redis

# Globals che verranno inizializzati nel main
supabase_client: Client = None
local_db_engine = None
redis_client: Redis = None


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
