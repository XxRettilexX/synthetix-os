from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from supabase import Client
from redis import Redis

from app.core.deps import get_supabase, get_local_db, get_redis

router = APIRouter()


@router.get("/health")
async def healthcheck():
    """Endpoint di healthcheck generale"""
    return {
        "status": "healthy",
        "service": "Synthetix OS API",
        "version": "1.0.0"
    }


@router.get("/health/detailed")
async def detailed_healthcheck(
    supabase: Client = Depends(get_supabase),
    local_db = Depends(get_local_db)
):
    """Healthcheck dettagliato con verifica delle connessioni"""
    
    health_status = {
        "status": "healthy",
        "services": {}
    }
    
    # Check Supabase
    try:
        # Prova a fare una query semplice
        result = supabase.table("profiles").select("id").limit(1).execute()
        health_status["services"]["supabase"] = {
            "status": "connected",
            "message": "Supabase connection OK"
        }
    except Exception as e:
        health_status["services"]["supabase"] = {
            "status": "error",
            "message": str(e)
        }
        health_status["status"] = "degraded"
    
    # Check Local DB (PostgreSQL or SQLite)
    try:
        with local_db.connect() as conn:
            # Check if it's SQLite or Postgres
            db_url = str(local_db.url)
            if "sqlite" in db_url:
                result = conn.execute(text("SELECT sqlite_version()"))
                version = result.fetchone()[0]
                health_status["services"]["local_db"] = {
                    "status": "connected",
                    "type": "sqlite",
                    "version": version
                }
            else:
                result = conn.execute(text("SELECT current_database(), version()"))
                row = result.fetchone()
                health_status["services"]["local_db"] = {
                    "status": "connected",
                    "type": "postgres",
                    "database": row[0],
                    "version": row[1].split()[0] + " " + row[1].split()[1]
                }
    except Exception as e:
        health_status["services"]["local_db"] = {
            "status": "error",
            "message": str(e)
        }
        # Local DB might be critical for logs but not for the whole app in development
        # health_status["status"] = "degraded"
    
    # Check Redis (optional)
    try:
        redis = get_redis()
        redis.ping()
        info = redis.info("server")
        health_status["services"]["redis"] = {
            "status": "connected",
            "version": info.get("redis_version", "unknown")
        }
    except HTTPException:
        health_status["services"]["redis"] = {
            "status": "unavailable",
            "message": "Redis is optional and not configured"
        }
    except Exception as e:
        health_status["services"]["redis"] = {
            "status": "error",
            "message": str(e)
        }
    
    # Se uno dei servizi critici è down, ritorna 503
    if health_status["status"] == "degraded":
        raise HTTPException(status_code=503, detail=health_status)
    
    return health_status
