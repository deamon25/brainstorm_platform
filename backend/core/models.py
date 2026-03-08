"""
Database models for MongoDB documents
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic"""
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler):
        from pydantic_core import core_schema
        
        def validate(value):
            if isinstance(value, ObjectId):
                return value
            if isinstance(value, str) and ObjectId.is_valid(value):
                return ObjectId(value)
            raise ValueError("Invalid ObjectId")
        
        return core_schema.no_info_plain_validator_function(
            validate,
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x),
                return_schema=core_schema.str_schema(),
            ),
        )

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema, handler):
        return {"type": "string"}


class IdeaModel(BaseModel):
    """Database model for brainstorm ideas"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    session_id: str = Field(..., description="Brainstorming session ID")
    participant_id: Optional[str] = Field(None, description="Participant identifier")
    
    # Original content
    original_text: str = Field(..., description="Original idea text from user")
    
    # Processed content
    rephrased_text: Optional[str] = Field(None, description="AI-rephrased version")
    entities: List[Dict[str, Any]] = Field(default=[], description="Detected entities")
    
    # Metadata
    hesitation_score: Optional[float] = Field(None, description="Hesitation detection score")
    is_hesitant: Optional[bool] = Field(None, description="Whether hesitation was detected")
    typing_metrics: Optional[Dict[str, float]] = Field(None, description="Typing behavior metrics")
    
    # Status
    status: str = Field(default="draft", description="Idea status: draft, approved, rejected")
    is_approved: bool = Field(default=False, description="Whether user approved the rephrased version")
    
    # Clustering
    cluster_id: Optional[str] = Field(None, description="Cluster assignment for analytics")
    tags: List[str] = Field(default=[], description="Tags for categorization")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "json_schema_extra": {
            "example": {
                "session_id": "session_123",
                "participant_id": "user_456",
                "original_text": "I think maybe we should implement the login feature.",
                "rephrased_text": "We should implement the login feature.",
                "entities": [
                    {"text": "login feature", "label": "FEATURE"}
                ],
                "hesitation_score": -0.25,
                "is_hesitant": True,
                "status": "approved",
                "is_approved": True
            }
        }
    }


class SessionModel(BaseModel):
    """Database model for brainstorming sessions"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    session_name: str = Field(..., description="Name of the brainstorming session")
    description: Optional[str] = Field(None, description="Session description")
    
    # Participants
    participant_ids: List[str] = Field(default=[], description="List of participant IDs")
    
    # Statistics
    total_ideas: int = Field(default=0, description="Total number of ideas submitted")
    approved_ideas: int = Field(default=0, description="Number of approved ideas")
    
    # Session metadata
    status: str = Field(default="active", description="Session status: active, completed, archived")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = Field(None, description="When session was ended")
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "json_schema_extra": {
            "example": {
                "session_name": "Sprint Planning Q1 2026",
                "description": "Brainstorming ideas for Q1 sprint planning",
                "participant_ids": ["user_1", "user_2", "user_3"],
                "total_ideas": 25,
                "approved_ideas": 18,
                "status": "active"
            }
        }
    }


class ClusterModel(BaseModel):
    """Database model for idea clusters"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    session_id: str = Field(..., description="Associated session ID")
    cluster_name: str = Field(..., description="Name/label of the cluster")
    
    # Cluster metadata
    idea_ids: List[str] = Field(default=[], description="IDs of ideas in this cluster")
    idea_count: int = Field(default=0, description="Number of ideas in cluster")
    
    # Analysis
    keywords: List[str] = Field(default=[], description="Key terms representing this cluster")
    description: Optional[str] = Field(None, description="Auto-generated cluster description")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "json_schema_extra": {
            "example": {
                "session_id": "session_123",
                "cluster_name": "Authentication Features",
                "idea_ids": ["id1", "id2", "id3"],
                "idea_count": 3,
                "keywords": ["login", "authentication", "security", "user management"]
            }
        }
    }
