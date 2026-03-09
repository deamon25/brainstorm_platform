"""
Configuration settings for Brainstorm Platform Service
"""
import os
from pathlib import Path
from typing import Optional, List
from pydantic import field_validator, model_validator
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
    DEBUG: bool = False
    
    # CORS
    BACKEND_CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    
    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]
    
    # Model Paths — overridable via env; sub-paths derived in validator below
    MODELS_DIR: Path = Path(__file__).parent.parent.parent / "models" / "brainstorm_platform"
    
    ENTITY_NER_MODEL_PATH: Optional[Path] = None
    ENTITY_REPHRASER_MODEL_PATH: Optional[Path] = None
    HESITATION_MODEL_PATH: Optional[Path] = None
    SCALER_PATH: Optional[Path] = None
    SPEECH_HESITATION_MODEL_PATH: Optional[Path] = None

    # Groq API — free tier rephrasing
    # Get your free key at: https://console.groq.com
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    @model_validator(mode="after")
    def derive_model_paths(self) -> "Settings":
        base = self.MODELS_DIR
        if self.ENTITY_NER_MODEL_PATH is None:
            self.ENTITY_NER_MODEL_PATH = base / "entity_ner_model"
        if self.ENTITY_REPHRASER_MODEL_PATH is None:
            self.ENTITY_REPHRASER_MODEL_PATH = base / "entity_rephraser_model"
        if self.HESITATION_MODEL_PATH is None:
            self.HESITATION_MODEL_PATH = base / "hesitation_model" / "hesitation_model .pkl"
        if self.SCALER_PATH is None:
            self.SCALER_PATH = base / "hesitation_model" / "scaler.pkl"
        if self.SPEECH_HESITATION_MODEL_PATH is None:
            self.SPEECH_HESITATION_MODEL_PATH = base / "hesitation_speech_model" / "speech_hesitation_model.pth"
        return self

    # Gemini API (used for rephrasing and idea suggestions)
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.0-flash"

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

