"""
API routes for brainstorm board storage (ideas and sessions)
"""
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Query

from core.schemas import (
    CreateIdeaRequest,
    UpdateIdeaRequest,
    IdeaResponse,
    IdeasListResponse,
    CreateSessionRequest,
    SessionResponse,
    SessionsListResponse
)
from core.crud_ideas import idea_crud
from core.crud_sessions import session_crud

logger = logging.getLogger(__name__)

router = APIRouter()


# ============= Ideas Endpoints =============

@router.post("/ideas", response_model=IdeaResponse, status_code=status.HTTP_201_CREATED)
async def create_idea(request: CreateIdeaRequest):
    """
    Create a new brainstorm idea.
    
    Stores an idea in the brainstorm board with optional AI enhancements:
    - Original text from user
    - Rephrased version (if approved)
    - Detected entities
    - Hesitation metrics
    - Tags and metadata
    
    **Example Request:**
    ```json
    {
        "session_id": "session_123",
        "participant_id": "user_456",
        "original_text": "We should add a dashboard feature.",
        "rephrased_text": "Add a comprehensive dashboard feature.",
        "entities": [{"text": "dashboard", "label": "FEATURE"}],
        "hesitation_score": -0.15,
        "is_hesitant": false,
        "is_approved": true,
        "tags": ["UI", "analytics"]
    }
    ```
    """
    try:
        # Create idea
        idea = await idea_crud.create_idea(request.model_dump(exclude_none=True))
        
        # Update session statistics
        await session_crud.update_session_statistics(request.session_id)
        
        # Convert to response
        idea_dict = idea.model_dump(by_alias=True)
        idea_dict["_id"] = str(idea_dict["_id"])
        idea_dict["created_at"] = idea_dict["created_at"].isoformat()
        idea_dict["updated_at"] = idea_dict["updated_at"].isoformat()
        
        return IdeaResponse(**idea_dict)
    except Exception as e:
        logger.error(f"Failed to create idea: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create idea: {str(e)}"
        )


@router.get("/ideas/{idea_id}", response_model=IdeaResponse)
async def get_idea(idea_id: str):
    """Get a specific idea by ID"""
    try:
        idea = await idea_crud.get_idea(idea_id)
        if not idea:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Idea {idea_id} not found"
            )
        
        idea_dict = idea.model_dump(by_alias=True)
        idea_dict["_id"] = str(idea_dict["_id"])
        idea_dict["created_at"] = idea_dict["created_at"].isoformat()
        idea_dict["updated_at"] = idea_dict["updated_at"].isoformat()
        
        return IdeaResponse(**idea_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get idea: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get idea: {str(e)}"
        )


@router.get("/ideas", response_model=IdeasListResponse)
async def get_ideas(
    session_id: Optional[str] = Query(None, description="Filter by session ID"),
    participant_id: Optional[str] = Query(None, description="Filter by participant ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return")
):
    """
    Get list of ideas with optional filters.
    
    **Filters:**
    - `session_id`: Get ideas from a specific session
    - `participant_id`: Get ideas from a specific participant
    - `status`: Filter by status (draft, approved, rejected)
    - `skip` and `limit`: For pagination
    """
    try:
        ideas, total = await idea_crud.get_ideas(
            session_id=session_id,
            participant_id=participant_id,
            status=status,
            skip=skip,
            limit=limit
        )
        
        # Convert to response format
        idea_responses = []
        for idea in ideas:
            idea_dict = idea.model_dump(by_alias=True)
            idea_dict["_id"] = str(idea_dict["_id"])
            idea_dict["created_at"] = idea_dict["created_at"].isoformat()
            idea_dict["updated_at"] = idea_dict["updated_at"].isoformat()
            idea_responses.append(IdeaResponse(**idea_dict))
        
        return IdeasListResponse(
            ideas=idea_responses,
            total=total,
            session_id=session_id
        )
    except Exception as e:
        logger.error(f"Failed to get ideas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get ideas: {str(e)}"
        )


@router.put("/ideas/{idea_id}", response_model=IdeaResponse)
async def update_idea(idea_id: str, request: UpdateIdeaRequest):
    """
    Update an existing idea.
    
    Can update:
    - Status (draft, approved, rejected)
    - Approval flag
    - Cluster assignment
    - Tags
    """
    try:
        # Update idea
        idea = await idea_crud.update_idea(
            idea_id,
            request.model_dump(exclude_none=True)
        )
        
        if not idea:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Idea {idea_id} not found"
            )
        
        # Convert to response
        idea_dict = idea.model_dump(by_alias=True)
        idea_dict["_id"] = str(idea_dict["_id"])
        idea_dict["created_at"] = idea_dict["created_at"].isoformat()
        idea_dict["updated_at"] = idea_dict["updated_at"].isoformat()
        
        return IdeaResponse(**idea_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update idea: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update idea: {str(e)}"
        )


@router.delete("/ideas/{idea_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_idea(idea_id: str):
    """Delete an idea"""
    try:
        deleted = await idea_crud.delete_idea(idea_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Idea {idea_id} not found"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete idea: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete idea: {str(e)}"
        )


# ============= Sessions Endpoints =============

@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(request: CreateSessionRequest):
    """
    Create a new brainstorming session.
    
    **Example Request:**
    ```json
    {
        "session_name": "Sprint Planning Q1 2026",
        "description": "Planning session for Q1 sprint",
        "participant_ids": ["user_1", "user_2", "user_3"]
    }
    ```
    """
    try:
        session = await session_crud.create_session(request.model_dump())
        
        # Convert to response
        session_dict = session.model_dump(by_alias=True)
        session_dict["_id"] = str(session_dict["_id"])
        session_dict["created_at"] = session_dict["created_at"].isoformat()
        session_dict["updated_at"] = session_dict["updated_at"].isoformat()
        if session_dict.get("ended_at"):
            session_dict["ended_at"] = session_dict["ended_at"].isoformat()
        
        return SessionResponse(**session_dict)
    except Exception as e:
        logger.error(f"Failed to create session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create session: {str(e)}"
        )


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    """Get a specific session by ID"""
    try:
        session = await session_crud.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {session_id} not found"
            )
        
        session_dict = session.model_dump(by_alias=True)
        session_dict["_id"] = str(session_dict["_id"])
        session_dict["created_at"] = session_dict["created_at"].isoformat()
        session_dict["updated_at"] = session_dict["updated_at"].isoformat()
        if session_dict.get("ended_at"):
            session_dict["ended_at"] = session_dict["ended_at"].isoformat()
        
        return SessionResponse(**session_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get session: {str(e)}"
        )


@router.get("/sessions", response_model=SessionsListResponse)
async def get_sessions(
    status: Optional[str] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Maximum records to return")
):
    """Get list of sessions with optional filters"""
    try:
        sessions, total = await session_crud.get_sessions(
            status=status,
            skip=skip,
            limit=limit
        )
        
        # Convert to response format
        session_responses = []
        for session in sessions:
            session_dict = session.model_dump(by_alias=True)
            session_dict["_id"] = str(session_dict["_id"])
            session_dict["created_at"] = session_dict["created_at"].isoformat()
            session_dict["updated_at"] = session_dict["updated_at"].isoformat()
            if session_dict.get("ended_at"):
                session_dict["ended_at"] = session_dict["ended_at"].isoformat()
            session_responses.append(SessionResponse(**session_dict))
        
        return SessionsListResponse(
            sessions=session_responses,
            total=total
        )
    except Exception as e:
        logger.error(f"Failed to get sessions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get sessions: {str(e)}"
        )


@router.get("/sessions/{session_id}/statistics")
async def get_session_statistics(session_id: str):
    """Get statistics for a specific session"""
    try:
        # Verify session exists
        session = await session_crud.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {session_id} not found"
            )
        
        # Get statistics
        stats = await idea_crud.get_session_statistics(session_id)
        
        return {
            "session_id": session_id,
            "session_name": session.session_name,
            **stats
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get session statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get session statistics: {str(e)}"
        )
