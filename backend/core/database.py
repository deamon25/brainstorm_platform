"""
MongoDB database connection and initialization
"""
import logging
import ssl
import certifi
import dns.resolver
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
import urllib.parse

from core.config import settings

logger = logging.getLogger(__name__)

# Configure DNS to use Google's DNS for MongoDB SRV resolution
try:
    dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
    dns.resolver.default_resolver.nameservers = ['8.8.8.8', '8.8.4.4']
except Exception as e:
    logger.warning(f"Failed to configure DNS resolver: {e}")


class Database:
    """MongoDB database manager"""
    
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    _connected: bool = False
    
    @classmethod
    async def connect_db(cls):
        """Connect to MongoDB with Windows SSL/TLS compatibility"""
        try:
            logger.info(f"Connecting to MongoDB: {settings.MONGODB_URL}")
            
            # Parse the connection string
            is_atlas = "mongodb+srv" in settings.MONGODB_URL or "mongodb.net" in settings.MONGODB_URL
            
            # Base connection options
            connection_kwargs = {
                "serverSelectionTimeoutMS": 10000,
                "connectTimeoutMS": 10000,
            }
            
            # For MongoDB Atlas with SSL/TLS issues on Windows
            if is_atlas:
                logger.info("Detected MongoDB Atlas - connecting with verified TLS")

                connection_kwargs["tls"] = True
                connection_kwargs["tlsCAFile"] = certifi.where()
                connection_kwargs["retryWrites"] = True
                connection_kwargs["w"] = "majority"

                cls.client = AsyncIOMotorClient(
                    settings.MONGODB_URL,
                    **connection_kwargs
                )
            else:
                # Local MongoDB without SSL
                cls.client = AsyncIOMotorClient(
                    settings.MONGODB_URL,
                    **connection_kwargs
                )
            
            cls.db = cls.client[settings.MONGODB_DB_NAME]
            
            # Test connection
            await cls.client.admin.command('ping')
            cls._connected = True
            logger.info(f"✅ MongoDB connection successful! Database: {settings.MONGODB_DB_NAME}")
            
            # Create indexes
            await cls.create_indexes()
            
        except Exception as e:
            logger.error(f"MongoDB connection failed: {e}")
            cls._connected = False
            raise
    
    @classmethod
    async def close_db(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()
            logger.info("MongoDB connection closed")
    
    @classmethod
    async def create_indexes(cls):
        """Create database indexes for performance"""
        if cls.db is None:
            return
        
        try:
            # Ideas collection indexes
            await cls.db.ideas.create_index("session_id")
            await cls.db.ideas.create_index("participant_id")
            await cls.db.ideas.create_index("created_at")
            await cls.db.ideas.create_index([("created_at", -1)])
            
            # Sessions collection indexes
            await cls.db.sessions.create_index("created_at")
            await cls.db.sessions.create_index([("created_at", -1)])
            
            logger.info("Database indexes created successfully")
        except Exception as e:
            logger.warning(f"Error creating indexes: {e}")
    
    @classmethod
    def get_db(cls) -> AsyncIOMotorDatabase:
        """Get database instance"""
        if cls.db is None or not cls._connected:
            raise RuntimeError("Database not initialized. Call connect_db() first.")
        return cls.db
    
    @classmethod
    def is_connected(cls) -> bool:
        """Check if database is connected"""
        return cls._connected and cls.db is not None


# Global database instance
database = Database()
