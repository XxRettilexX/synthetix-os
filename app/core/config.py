from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Configurazione applicazione da variabili d'ambiente"""
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    
    # Database locale (PostgreSQL -> SQLite fallback for dev)
    # DATABASE_URL: str = "postgresql://synthetix:synthetix_password@postgres:5432/synthetix_logs"
    DATABASE_URL: str = "sqlite:///./synthetix.db"
    
    # Redis
    REDIS_URL: str = "redis://redis:6379/0"
    
    # Tailscale
    TAILSCALE_IP: Optional[str] = "100.64.0.1"
    
    # Environment
    ENVIRONMENT: str = "development"
    
    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Synthetix OS"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
