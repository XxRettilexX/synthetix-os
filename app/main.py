from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from redis import Redis
import logging

from app.core.config import settings
from app.core import deps
from app.api import healthcheck, devices, files

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestisce startup e shutdown dell'applicazione"""
    
    # Startup
    logger.info("🚀 Starting Synthetix OS API...")
    
    # Inizializza Supabase
    try:
        deps.supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        logger.info("✅ Supabase client initialized")
    except Exception as e:
        logger.error(f"❌ Failed to initialize Supabase: {e}")
    
    # Inizializza PostgreSQL locale
    try:
        deps.local_db_engine = create_engine(settings.DATABASE_URL)
        with deps.local_db_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("✅ Local PostgreSQL connected")
    except Exception as e:
        logger.error(f"❌ Failed to connect to local PostgreSQL: {e}")
    
    # Inizializza Redis
    try:
        deps.redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)
        deps.redis_client.ping()
        logger.info("✅ Redis connected")
    except Exception as e:
        logger.warning(f"⚠️  Redis not available: {e}")
    
    yield
    
    # Shutdown
    logger.info("👋 Shutting down Synthetix OS API...")
    if deps.local_db_engine:
        deps.local_db_engine.dispose()
    if deps.redis_client:
        deps.redis_client.close()


# Inizializza FastAPI
app = FastAPI(
    title="Synthetix OS API",
    description="Backend API per Synthetix OS - Personal Cloud & Device Management",
    version="1.0.0",
    lifespan=lifespan
)

# Configurazione CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Next.js dev
        "http://localhost:5173",      # Vite dev
        "https://*.vercel.app",       # Vercel deployment
        f"http://{settings.TAILSCALE_IP}:*",  # Tailscale network
        "*"  # In produzione, specificare solo i domini autorizzati
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(healthcheck.router, prefix="/api", tags=["Health"])
app.include_router(devices.router, prefix="/api/devices", tags=["Devices"])
app.include_router(files.router, prefix="/api/files", tags=["Files"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Synthetix OS API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }
