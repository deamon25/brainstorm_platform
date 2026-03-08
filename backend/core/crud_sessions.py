"""
CRUD operations for brainstorming sessions
"""
import logging
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from core.database import database
from core.models import SessionModel

logger = logging.getLogger(__name__)


class SessionCRUD:
    """CRUD operations for sessions"""
    
    @staticmethod
    async def create_session(session_data: dict) -> SessionModel:
        """Create a new session"""
        db = database.get_db()
        
        # Add timestamps
        session_data["created_at"] = datetime.utcnow()
        session_data["updated_at"] = datetime.utcnow()
        session_data["status"] = "active"
        session_data["total_ideas"] = 0
        session_data["approved_ideas"] = 0
        
        # Insert into database
        result = await db.sessions.insert_one(session_data)
        
        # Retrieve the created session
        created_session = await db.sessions.find_one({"_id": result.inserted_id})
        
        logger.info(f"Created session: {result.inserted_id}")
        return SessionModel(**created_session)
    
    @staticmethod
    async def get_session(session_id: str) -> Optional[SessionModel]:
        """Get a single session by ID"""
        db = database.get_db()
        
        try:
            session = await db.sessions.find_one({"_id": ObjectId(session_id)})
            if session:
                return SessionModel(**session)
            return None
        except Exception as e:
            logger.error(f"Error fetching session {session_id}: {e}")
            return None
    
    @staticmethod
    async def get_sessions(
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[SessionModel], int]:
        """Get sessions with optional filters"""
        db = database.get_db()
        
        # Build query
        query = {}
        if status:
            query["status"] = status
        
        # Get total count
        total = await db.sessions.count_documents(query)
        
        # Get sessions
        cursor = db.sessions.find(query).sort("created_at", -1).skip(skip).limit(limit)
        sessions = await cursor.to_list(length=limit)
        
        return [SessionModel(**session) for session in sessions], total
    
    @staticmethod
    async def update_session(session_id: str, update_data: dict) -> Optional[SessionModel]:
        """Update a session"""
        db = database.get_db()
        
        try:
            # Add updated timestamp
            update_data["updated_at"] = datetime.utcnow()
            
            # Update the session
            result = await db.sessions.find_one_and_update(
                {"_id": ObjectId(session_id)},
                {"$set": update_data},
                return_document=True
            )
            
            if result:
                logger.info(f"Updated session: {session_id}")
                return SessionModel(**result)
            return None
        except Exception as e:
            logger.error(f"Error updating session {session_id}: {e}")
            return None
    
    @staticmethod
    async def delete_session(session_id: str) -> bool:
        """Delete a session"""
        db = database.get_db()
        
        try:
            result = await db.sessions.delete_one({"_id": ObjectId(session_id)})
            if result.deleted_count > 0:
                logger.info(f"Deleted session: {session_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting session {session_id}: {e}")
            return False
    
    @staticmethod
    async def update_session_statistics(session_id: str):
        """Update session statistics based on ideas"""
        db = database.get_db()
        
        try:
            # Count total ideas
            total_ideas = await db.ideas.count_documents({"session_id": session_id})
            
            # Count approved ideas
            approved_ideas = await db.ideas.count_documents({
                "session_id": session_id,
                "is_approved": True
            })
            
            # Update session
            await db.sessions.update_one(
                {"_id": ObjectId(session_id)},
                {
                    "$set": {
                        "total_ideas": total_ideas,
                        "approved_ideas": approved_ideas,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            logger.info(f"Updated statistics for session {session_id}")
        except Exception as e:
            logger.error(f"Error updating session statistics: {e}")


# Global instance
session_crud = SessionCRUD()
