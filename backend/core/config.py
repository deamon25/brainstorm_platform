"""
Configuration settings for Brainstorm Platform Service
"""
import os
from pathlib import Path
from typing import Optional, List
from pydantic import field_validator
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Get the directory where this config file is located
CONFIG_DIR = Path(__file__).parent
SERVICE_DIR = CONFIG_DIR.parent
ENV_PATH = SERVICE_DIR / ".env"

# Load .env file explicitly
load_dotenv(ENV_PATH)


class Settings(BaseSettings):
    """Application settings"""
    
    # API Settings
    API_VERSION: str = "v1"
    API_PREFIX: str = f"/api/{API_VERSION}"
    PROJECT_NAME: str = "Brainstorm Platform Service"
    DEBUG: bool = True
    
    # CORS
    BACKEND_CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    
    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]
    
    # Model Paths
    BASE_DIR: Path = Path(__file__).parent.parent.parent
    MODELS_DIR: Path = BASE_DIR / "models" / "brainstorm_platform"
    
    ENTITY_NER_MODEL_PATH: Path = MODELS_DIR / "entity_ner_model"
    ENTITY_REPHRASER_MODEL_PATH: Path = MODELS_DIR / "entity_rephraser_model"
    HESITATION_MODEL_PATH: Path = MODELS_DIR / "hesitation_model" / "hesitation_model .pkl"
    SCALER_PATH: Path = MODELS_DIR / "hesitation_model" / "scaler.pkl"
    SPEECH_HESITATION_MODEL_PATH: Path = MODELS_DIR / "hesitation_speech_model" / "speech_hesitation_model.pth"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8004
    
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "brainstorm_platform"
    
    class Config:
        env_file = str(SERVICE_DIR / ".env")
        case_sensitive = True


settings = Settings()
