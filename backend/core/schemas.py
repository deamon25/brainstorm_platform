"""
Pydantic schemas for request/response validation
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# ============= Request Schemas =============

class TypingSessionRequest(BaseModel):
    """Request for hesitation detection from typing session data"""
    delFreq: float = Field(..., ge=0, description="Total number of deletions (backspaces)")
    leftFreq: float = Field(..., ge=0, description="Total number of left arrow key presses")
    TotTime: float = Field(..., gt=0, description="Total time taken for typing session in milliseconds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "delFreq": 10,
                "leftFreq": 5,
                "TotTime": 15000
            }
        }


class TextAnalysisRequest(BaseModel):
    """Request for analyzing communication text"""
    text: str = Field(..., min_length=1, description="Text to analyze")
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "I think maybe we could potentially try implementing the user authentication feature."
            }
        }


class RephraseRequest(BaseModel):
    """Request for rephrasing text"""
    text: str = Field(..., min_length=1, description="Text to rephrase")
    context: Optional[str] = Field(None, description="Additional context for rephrasing")
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "I think maybe we could try implementing authentication.",
                "context": "Technical discussion"
            }
        }


class BrainstormAnalysisRequest(BaseModel):
    """Complete brainstorm session analysis"""
    text: str = Field(..., min_length=1, description="Brainstorming text or transcript")
    participant_id: Optional[str] = Field(None, description="ID of participant")
    session_id: Optional[str] = Field(None, description="Brainstorming session ID")


# ============= Response Schemas =============

class EntityResult(BaseModel):
    """Named entity recognition result"""
    text: str
    label: str
    start: int
    end: int


class EntityExtractionResponse(BaseModel):
    """Response for entity extraction"""
    entities: List[EntityResult]
    entity_count: int
    text_length: int


class HesitationResult(BaseModel):
    """Hesitation detection result from Isolation Forest model"""
    hesitation_score: float = Field(..., description="Anomaly score from Isolation Forest (lower = more hesitant)")
    is_hesitant: bool = Field(..., description="True if session is hesitant (anomaly detected)")
    input_features: Dict[str, float] = Field(..., description="Raw and derived features used for prediction")


class RephraseResult(BaseModel):
    """Result of text rephrasing"""
    original_text: str
    rephrased_text: str
    improvements: List[str]


class EntityPreservingRephraseResult(BaseModel):
    """Result of entity-preserving text rephrasing"""
    original_text: str = Field(..., description="The original input text")
    rephrased_text: str = Field(..., description="The rephrased text with entities preserved")
    entities_detected: List[Dict[str, str]] = Field(default=[], description="List of detected entities with text and label")
    entity_map: Dict[str, str] = Field(default={}, description="Mapping of ENTITY_X placeholders to original entity text")
    masked_text: Optional[str] = Field(None, description="The text with entities masked (for debugging)")


class EntityPreservingRephraseRequest(BaseModel):
    """Request for entity-preserving rephrasing"""
    text: str = Field(..., min_length=1, description="Text to rephrase while preserving entities")
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "I think maybe John could work with the Marketing team on the Q4 Sprint to implement the new Dashboard feature."
            }
        }


class ComprehensiveAnalysisResponse(BaseModel):
    """Complete analysis of brainstorming contribution"""
    original_text: str
    entities: List[EntityResult]
    hesitation: HesitationResult
    rephrased_suggestion: Optional[RephraseResult]
    confidence_metrics: Dict[str, float]
    recommendations: List[str]


# ============= Health Check =============

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    models_loaded: Dict[str, bool]


# ============= Brainstorm Board / Storage =============

class CreateIdeaRequest(BaseModel):
    """Request to create a new idea"""
    session_id: str = Field(..., description="Brainstorming session ID")
    participant_id: Optional[str] = Field(None, description="Participant identifier")
    original_text: str = Field(..., min_length=1, description="Original idea text")
    rephrased_text: Optional[str] = Field(None, description="AI-rephrased version")
    entities: Optional[List[Dict[str, Any]]] = Field(default=[], description="Detected entities")
    hesitation_score: Optional[float] = Field(None, description="Hesitation score")
    is_hesitant: Optional[bool] = Field(None, description="Hesitation detected")
    typing_metrics: Optional[Dict[str, float]] = Field(None, description="Typing behavior data")
    is_approved: bool = Field(default=False, description="User approved the rephrased version")
    tags: List[str] = Field(default=[], description="Custom tags")
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "session_123",
                "participant_id": "user_456",
                "original_text": "I think maybe we should add a dashboard.",
                "rephrased_text": "We should add a dashboard.",
                "entities": [{"text": "dashboard", "label": "FEATURE"}],
                "hesitation_score": -0.25,
                "is_hesitant": True,
                "is_approved": True,
                "tags": ["UI", "analytics"]
            }
        }


class UpdateIdeaRequest(BaseModel):
    """Request to update an existing idea"""
    status: Optional[str] = Field(None, description="Update status: draft, approved, rejected")
    is_approved: Optional[bool] = Field(None, description="Approval status")
    cluster_id: Optional[str] = Field(None, description="Assign to cluster")
    tags: Optional[List[str]] = Field(None, description="Update tags")


class IdeaResponse(BaseModel):
    """Response for a single idea"""
    id: str = Field(..., alias="_id")
    session_id: str
    participant_id: Optional[str]
    original_text: str
    rephrased_text: Optional[str]
    entities: List[Dict[str, Any]]
    hesitation_score: Optional[float]
    is_hesitant: Optional[bool]
    status: str
    is_approved: bool
    cluster_id: Optional[str]
    tags: List[str]
    created_at: str
    updated_at: str
    
    class Config:
        populate_by_name = True


class IdeasListResponse(BaseModel):
    """Response for list of ideas"""
    ideas: List[IdeaResponse]
    total: int
    session_id: Optional[str] = None


class CreateSessionRequest(BaseModel):
    """Request to create a new brainstorming session"""
    session_name: str = Field(..., min_length=1, description="Name of the session")
    description: Optional[str] = Field(None, description="Session description")
    participant_ids: List[str] = Field(default=[], description="Initial participant IDs")
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_name": "Sprint Planning Q1 2026",
                "description": "Brainstorming for Q1 sprint planning",
                "participant_ids": ["user_1", "user_2"]
            }
        }


class SessionResponse(BaseModel):
    """Response for a session"""
    id: str = Field(..., alias="_id")
    session_name: str
    description: Optional[str]
    participant_ids: List[str]
    total_ideas: int
    approved_ideas: int
    status: str
    created_at: str
    updated_at: str
    ended_at: Optional[str]
    
    class Config:
        populate_by_name = True


class SessionsListResponse(BaseModel):
    """Response for list of sessions"""
    sessions: List[SessionResponse]
    total: int


# ============= Speech Hesitation =============

class SpeechHesitationBase64Request(BaseModel):
    """Request for speech hesitation detection via base64-encoded audio"""
    audio_base64: str = Field(..., description="Base64-encoded audio file content")
    format: str = Field(default="wav", description="Audio format hint (wav, mp3, ogg, flac)")

    class Config:
        json_schema_extra = {
            "example": {
                "audio_base64": "<base64 string>",
                "format": "wav"
            }
        }


class SpeechHesitationResult(BaseModel):
    """Prediction result for a single audio clip"""
    prediction: int = Field(..., description="0 = fluent, 1 = hesitation detected, -1 = error")
    label: str = Field(..., description="'fluent', 'hesitation_detected', or 'error'")
    confidence_fluent: float = Field(..., description="Softmax probability for the fluent class")
    confidence_hesitation: float = Field(..., description="Softmax probability for the hesitation class")

    class Config:
        json_schema_extra = {
            "example": {
                "prediction": 1,
                "label": "hesitation_detected",
                "confidence_fluent": 0.12,
                "confidence_hesitation": 0.88
            }
        }


class SpeechHesitationBatchItemResult(BaseModel):
    """Prediction result for one file in a batch request"""
    filename: str
    prediction: int = Field(..., description="0 = fluent, 1 = hesitation detected, -1 = error")
    label: str
    confidence_fluent: float
    confidence_hesitation: float
    error: Optional[str] = Field(None, description="Error message if this file failed")


class SpeechHesitationBatchResponse(BaseModel):
    """Response for batch prediction endpoint"""
    results: List[SpeechHesitationBatchItemResult]
    total: int


class SpeechHealthResponse(BaseModel):
    """Health check response for the speech hesitation model"""
    status: str
    model: str
    model_loaded: bool
