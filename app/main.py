from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from supabase import create_client
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from redis import Redis
import logging

from app.core.config import settings
from app.core import deps
from app.core.mock_supabase import MockSupabaseClient
from app.api import auth, healthcheck, devices, files, ws, profiles

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
    # Inizializza Supabase
    try:
        # Check if using placeholder/mock credentials
        if "mock_key" in settings.SUPABASE_KEY or settings.SUPABASE_URL == "https://example.supabase.co":
             logger.warning("⚠️ Using MOCK Supabase Client - Persistance is volatile")
             deps.supabase_client = MockSupabaseClient(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        else:
             deps.supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        logger.info("✅ Supabase client initialized")
    except Exception as e:
        logger.error(f"❌ Failed to initialize Supabase: {e}")
    
    # Seed Mock Data if applicable
    if deps.supabase_client and hasattr(deps.supabase_client, "_tables"):
        logger.info("🌱 Seeding Mock Data...")
        deps.supabase_client.table("devices").insert({
            "id": "mock-dev-1",
            "name": "Local MacBook Light",
            "device_type": "virtual_light",
            "state": {"on": True, "brightness": 100},
            "user_id": "mock-user-id",
            "created_at": "2026-02-11T12:00:00Z"
        }).execute()
        deps.supabase_client.table("files").insert({
            "id": "mock-file-1",
            "name": "System_Config.yaml",
            "path": "/System_Config.yaml",
            "storage_path": "mock/path/System_Config.yaml",
            "size": 1240,
            "user_id": "mock-user-id",
            "created_at": "2026-02-11T12:00:00Z"
        }).execute()
    
    # Inizializza DB Locale (PostgreSQL o SQLite)
    try:
        connect_args = {}
        if settings.DATABASE_URL.startswith("sqlite"):
            connect_args = {"check_same_thread": False}
            
        deps.local_db_engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
        with deps.local_db_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("✅ Local Database connected")
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
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(devices.router, prefix="/api/devices", tags=["Devices"])
app.include_router(ws.router, prefix="/api/ws", tags=["Websocket"])
app.include_router(files.router, prefix="/api/files", tags=["Files"])
app.include_router(profiles.router, prefix="/api/profiles", tags=["Profiles"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Synthetix OS API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "ui": "/ui"
    }


@app.get("/ui", response_class=HTMLResponse)
async def api_ui():
    """Dynamic UI to list all available API endpoints"""
    routes_html = ""
    
    # Sort routes by path
    sorted_routes = sorted(app.routes, key=lambda x: getattr(x, "path", ""))
    
    for route in sorted_routes:
        # Skip internal or heartbeat routes if desired, but here we show relevant ones
        if hasattr(route, "methods") and hasattr(route, "path"):
            methods = ", ".join(route.methods)
            path = route.path
            
            # Get description from docstring or summary
            description = getattr(route, "description", None)
            if not description and hasattr(route, "endpoint"):
                description = route.endpoint.__doc__ or "No description available."
            
            # Use the first method for styling color
            primary_method = list(route.methods)[0] if route.methods else "GET"
            
            routes_html += f"""
            <div class="endpoint">
                <span class="method {primary_method}">{methods}</span>
                <span class="path">{path}</span>
                <div class="description">{description.strip()}</div>
            </div>
            """

    html_content = f"""
    <!DOCTYPE html>
    <html>
        <head>
            <title>Synthetix OS API Explorer</title>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 20px; background-color: #f4f7f6; }}
                h1 {{ color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }}
                .endpoint {{ background: #fff; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); transition: transform 0.2s; }}
                .endpoint:hover {{ transform: translateY(-3px); box-shadow: 0 4px 10px rgba(0,0,0,0.15); }}
                .method {{ display: inline-block; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8em; margin-right: 10px; color: #fff; min-width: 60px; text-align: center; }}
                .GET {{ background-color: #61affe; }}
                .POST {{ background-color: #49cc90; }}
                .PUT {{ background-color: #fca130; }}
                .DELETE {{ background-color: #f93e3e; }}
                .PATCH {{ background-color: #50e3c2; }}
                .path {{ font-family: 'Courier New', Courier, monospace; font-weight: bold; color: #2980b9; font-size: 1.1em; }}
                .description {{ margin-top: 8px; color: #666; font-size: 0.95em; white-space: pre-wrap; }}
                .footer {{ margin-top: 50px; text-align: center; font-size: 0.8em; color: #95a5a6; }}
                .header-info {{ margin-bottom: 30px; padding: 10px; background: #e8f4fd; border-left: 5px solid #3498db; border-radius: 4px; }}
            </style>
        </head>
        <body>
            <h1>🚀 Synthetix OS API Explorer</h1>
            <div class="header-info">
                <strong>Versione:</strong> 1.0.0 | 
                <strong>Status:</strong> Running | 
                <strong>Auto-Refresh:</strong> Attivo (Questa pagina si aggiorna dinamicamente in base alle rotte del codice)
            </div>
            
            <div id="endpoints-container">
                {routes_html}
            </div>

            <div class="footer">
                Synthetix OS - Generato automaticamente dal sistema
            </div>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content)


