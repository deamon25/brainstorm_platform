"""
CRUD operations for brainstorming ideas
"""

import logging
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from core.database import database
from core.models import IdeaModel

logger = logging.getLogger(__name__)


class IdeaCRUD:
    """CRUD operations for ideas"""
    
    @staticmethod
    async def create_idea(idea_data: dict) -> IdeaModel:
        """Create a new idea"""
        db = database.get_db()
        
        # Add timestamps
        idea_data["created_at"] = datetime.utcnow()
        idea_data["updated_at"] = datetime.utcnow()
        
        # Insert into database
        result = await db.ideas.insert_one(idea_data)
        
        # Retrieve the created idea
        created_idea = await db.ideas.find_one({"_id": result.inserted_id})
        logger.info(f"Created idea: {result.inserted_id}")
        
        return IdeaModel(**created_idea)
    
    @staticmethod
    async def get_idea(idea_id: str) -> Optional[IdeaModel]:
        """Get a single idea by ID"""
        try:
            db = database.get_db()
            idea = await db.ideas.find_one({"_id": ObjectId(idea_id)})
            
            if idea:
                return IdeaModel(**idea)
            return None
        except Exception as e:
            logger.error(f"Error fetching idea {idea_id}: {e}")
            return None
    
    @staticmethod
    async def get_ideas(
        session_id: Optional[str] = None,
        participant_id: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[IdeaModel], int]:
        """Get ideas with optional filters"""
        db = database.get_db()
        
        # Build query
        query = {}
        if session_id:
            query["session_id"] = session_id
        if participant_id:
            query["participant_id"] = participant_id
        if status:
            query["status"] = status
        
        # Get total count
        total = await db.ideas.count_documents(query)
        
        # Get ideas
        cursor = db.ideas.find(query).sort("created_at", -1).skip(skip).limit(limit)
        ideas = await cursor.to_list(length=limit)
        
        return [IdeaModel(**idea) for idea in ideas], total
    
    @staticmethod
    async def update_idea(idea_id: str, update_data: dict) -> Optional[IdeaModel]:
        """Update an idea"""
        try:
            db = database.get_db()
            
            # Add updated timestamp
            update_data["updated_at"] = datetime.utcnow()
            
            # Update the idea
            result = await db.ideas.find_one_and_update(
                {"_id": ObjectId(idea_id)},
                {"$set": update_data},
                return_document=True
            )
            
            if result:
                logger.info(f"Updated idea: {idea_id}")
                return IdeaModel(**result)
            return None
        except Exception as e:
            logger.error(f"Error updating idea {idea_id}: {e}")
            return None
    
    @staticmethod
    async def delete_idea(idea_id: str) -> bool:
        """Delete an idea"""
        try:
            db = database.get_db()
            result = await db.ideas.delete_one({"_id": ObjectId(idea_id)})
            
            if result.deleted_count > 0:
                logger.info(f"Deleted idea: {idea_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting idea {idea_id}: {e}")
            return False
    
    @staticmethod
    async def get_session_statistics(session_id: str) -> dict:
        """Get statistics for a session"""
        try:
            db = database.get_db()
            
            total = await db.ideas.count_documents({"session_id": session_id})
            approved = await db.ideas.count_documents({
                "session_id": session_id,
                "is_approved": True
            })
            hesitant = await db.ideas.count_documents({
                "session_id": session_id,
                "is_hesitant": True
            })
            
            return {
                "total_ideas": total,
                "approved_ideas": approved,
                "hesitant_ideas": hesitant,
                "approval_rate": (approved / total * 100) if total > 0 else 0
            }
        except Exception as e:
            logger.error(f"Error getting session statistics: {e}")
            return {
                "total_ideas": 0,
                "approved_ideas": 0,
                "hesitant_ideas": 0,
                "approval_rate": 0
            }


# Global instance
idea_crud = IdeaCRUD()
