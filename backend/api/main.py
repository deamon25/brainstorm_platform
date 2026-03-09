"""
FastAPI application for Brainstorm Platform Service
"""
import asyncio
import logging
from contextlib import asynccontextmanager, suppress

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


DB_RETRY_INTERVAL_SECONDS = 10


async def _retry_db_connection_loop():
    """Retry MongoDB connection in the background until it succeeds."""
    while not database.is_connected():
        try:
            await database.connect_db()
            logger.info("MongoDB reconnected successfully in background")
            return
        except Exception as e:
            logger.warning(
                f"Background MongoDB reconnect failed: {e}. "
                f"Retrying in {DB_RETRY_INTERVAL_SECONDS}s..."
            )
            await asyncio.sleep(DB_RETRY_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup: Connect to database and load models
    logger.info("Starting Brainstorm Platform Service...")
    db_retry_task = None
    
    try:
        # Connect to MongoDB
        await database.connect_db()
        logger.info("MongoDB connected successfully!")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        logger.warning("Continuing without database (AI features will still work)")
        db_retry_task = asyncio.create_task(_retry_db_connection_loop())
    
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
    if db_retry_task and not db_retry_task.done():
        db_retry_task.cancel()
        with suppress(asyncio.CancelledError):
            await db_retry_task
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
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
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
            "connected": database.is_connected()
        },
        "models": models_status
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
