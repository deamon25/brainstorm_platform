"""
FastAPI application for Brainstorm Platform Service
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.database import database
from inference.model_loader import model_manager
from api.routes import router
from api.storage_routes import router as storage_router
from api.speech_routes import router as speech_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup: Connect to database and load models
    logger.info("Starting Brainstorm Platform Service...")
    
    try:
        # Connect to MongoDB
        await database.connect_db()
        logger.info("MongoDB connected successfully!")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        logger.warning("Continuing without database (AI features will still work)")
    
    try:
        # Load ML models
        model_manager.load_all_models()
        logger.info("All models loaded successfully!")
    except Exception as e:
        logger.error(f"Failed to load models: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down Brainstorm Platform Service...")
    await database.close_db()


# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.API_VERSION,
    description="API for brainstorm platform with entity extraction, hesitation detection, and text rephrasing",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router, prefix=settings.API_PREFIX, tags=["brainstorm"])
app.include_router(storage_router, prefix=settings.API_PREFIX, tags=["storage"])
app.include_router(speech_router, prefix=settings.API_PREFIX, tags=["speech-hesitation"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.API_VERSION,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint"""
    from inference.model_loader import model_manager
    
    models_status = model_manager.get_models_status()
    
    health = {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.API_VERSION,
        "database": {
            "connected": database.is_connected(),
            "name": settings.MONGODB_DB_NAME
        },
        "models": models_status,
        "cors_origins": settings.cors_origins
    }
    
    # Overall status
    if not database.is_connected():
        health["status"] = "degraded"
        health["message"] = "Database not connected, storage features unavailable"
    
    return health


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
