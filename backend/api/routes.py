"""
API routes for Brainstorm Platform Service
"""
import logging
from typing import List

from fastapi import APIRouter, HTTPException, status

from core.schemas import (
    TextAnalysisRequest,
    TypingSessionRequest,
    RephraseRequest,
    EntityPreservingRephraseRequest,
    BrainstormAnalysisRequest,
    EntityExtractionResponse,
    HesitationResult,
    RephraseResult,
    EntityPreservingRephraseResult,
    ComprehensiveAnalysisResponse,
    HealthResponse,
    TypingProcessRequest,
    TypingProcessResponse,
)
from inference.entity_extraction import entity_extractor
from inference.rephraser import text_rephraser
from inference.hesitation_detector import hesitation_detector
from inference.model_loader import model_manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    models_status = model_manager.get_models_status()
    
    return HealthResponse(
        status="healthy" if all(models_status.values()) else "degraded",
        service="Brainstorm Platform",
        models_loaded=models_status
    )


@router.post("/extract-entities", response_model=EntityExtractionResponse)
async def extract_entities(request: TextAnalysisRequest):
    """
    Extract named entities from brainstorming text
    
    - **text**: The text to analyze for entities
    """
    try:
        entities = entity_extractor.extract_entities(request.text)
        
        return EntityExtractionResponse(
            entities=entities,
            entity_count=len(entities),
            text_length=len(request.text)
        )
    except Exception as e:
        logger.error(f"Entity extraction failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Entity extraction failed. Please try again later."
        )


@router.post("/detect-hesitation", response_model=HesitationResult)
async def detect_hesitation(request: TypingSessionRequest):
    """
    Detect hesitation from typing session behavior using Isolation Forest.
    
    The model analyzes typing patterns to identify hesitant behavior:
    - More deletions/backspaces indicate uncertainty
    - More left arrow key presses suggest corrections
    - Longer typing times with many corrections indicate hesitation
    
    **Input:**
    - **delFreq**: Number of deletions (backspaces)
    - **leftFreq**: Number of left arrow key presses
    - **TotTime**: Total typing time in milliseconds
    
    **Output:**
    - **hesitation_score**: Anomaly score (lower = more hesitant)
    - **is_hesitant**: Boolean indicating if session shows hesitation
    - **input_features**: All features used for prediction
    
    **Example Request:**
    ```json
    {
        "delFreq": 10,
        "leftFreq": 5,
        "TotTime": 15000
    }
    ```
    """
    try:
        result = hesitation_detector.detect_hesitation(
            delFreq=request.delFreq,
            leftFreq=request.leftFreq,
            TotTime=request.TotTime
        )
        return result
    except Exception as e:
        logger.error(f"Hesitation detection failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Hesitation detection failed. Please try again later."
        )


@router.post("/rephrase", response_model=RephraseResult)
async def rephrase_text(request: RephraseRequest):
    """
    Rephrase text for improved clarity and inclusivity (legacy endpoint)
    
    - **text**: The text to rephrase
    - **context**: Optional context for better rephrasing
    """
    try:
        result = text_rephraser.rephrase_text(request.text, request.context)
        return result
    except Exception as e:
        logger.error(f"Rephrasing failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Rephrasing failed. Please try again later."
        )


@router.post("/entity-preserving-rephrase", response_model=EntityPreservingRephraseResult)
async def entity_preserving_rephrase(request: EntityPreservingRephraseRequest):
    """
    Rephrase text while preserving named entities.
    
    This endpoint uses a two-step process:
    1. **Entity Detection**: Uses spaCy NER to identify entities (people, teams, sprints, features, etc.)
    2. **Entity Masking**: Replaces entities with ENTITY_X placeholders
    3. **T5 Rephrasing**: Rephrases the masked text professionally
    4. **Entity Restoration**: Restores original entities in the rephrased text
    
    **Input:**
    - **text**: The raw text that needs to be rephrased
    
    **Output:**
    - **original_text**: The original input text
    - **rephrased_text**: The professionally rephrased text with entities preserved
    - **entities_detected**: List of detected entities with their labels
    - **entity_map**: Mapping of ENTITY_X placeholders to original values
    - **masked_text**: The text with entities masked (for debugging)
    
    **Example Request:**
    ```json
    {
        "text": "I think maybe John could work with the Marketing team on the Q4 Sprint to implement the new Dashboard feature."
    }
    ```
    
    **Example Response:**
    ```json
    {
        "original_text": "I think maybe John could work with the Marketing team...",
        "rephrased_text": "John should collaborate with the Marketing team on the Q4 Sprint to implement the Dashboard feature.",
        "entities_detected": [
            {"text": "John", "label": "PERSON"},
            {"text": "Marketing team", "label": "ORG"},
            {"text": "Q4 Sprint", "label": "EVENT"},
            {"text": "Dashboard", "label": "PRODUCT"}
        ],
        "entity_map": {
            "ENTITY_1": "Marketing team",
            "ENTITY_2": "Q4 Sprint",
            "ENTITY_3": "Dashboard",
            "ENTITY_4": "John"
        },
        "masked_text": "I think maybe ENTITY_4 could work with the ENTITY_1..."
    }
    ```
    """
    try:
        result = text_rephraser.rephrase_with_entity_preservation(request.text)
        return result
    except Exception as e:
        logger.error(f"Entity-preserving rephrasing failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Entity-preserving rephrasing failed. Please try again later."
        )


@router.post("/analyze", response_model=ComprehensiveAnalysisResponse)
async def comprehensive_analysis(request: BrainstormAnalysisRequest):
    """
    Perform comprehensive analysis of brainstorming contribution.
    
    **Note**: This endpoint currently only supports entity extraction and rephrasing.
    Hesitation detection requires typing session data (delFreq, leftFreq, TotTime)
    and should be called separately via /detect-hesitation endpoint.
    
    - **text**: The brainstorming text or transcript
    - **participant_id**: Optional participant identifier
    - **session_id**: Optional session identifier
    """
    try:
        # Extract entities
        entities = entity_extractor.extract_entities(request.text)
        
        # Note: Hesitation detection now requires typing metadata, not text
        # Return a placeholder hesitation result
        hesitation = HesitationResult(
            hesitation_score=0.0,
            is_hesitant=False,
            input_features={
                "note": "Hesitation detection requires typing session data. Use /detect-hesitation endpoint."
            }
        )
        
        # Generate rephrased suggestion
        rephrased = text_rephraser.rephrase_text(request.text)
        
        # Generate recommendations
        recommendations = _generate_recommendations(hesitation, entities)
        
        # Calculate confidence metrics
        confidence_metrics = {
            "entity_extraction_confidence": 0.95,  # spaCy is generally reliable
            "rephrasing_confidence": 0.90,
            "overall_analysis_confidence": 0.925
        }
        
        return ComprehensiveAnalysisResponse(
            original_text=request.text,
            entities=entities,
            hesitation=hesitation,
            rephrased_suggestion=rephrased,
            confidence_metrics=confidence_metrics,
            recommendations=recommendations
        )
        
    except Exception as e:
        logger.error(f"Comprehensive analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Analysis failed. Please try again later."
        )


def _generate_recommendations(hesitation: HesitationResult, entities: List) -> List[str]:
    """Generate actionable recommendations based on analysis"""
    recommendations = []
    
    # Check if hesitation was detected from typing behavior
    if hesitation.is_hesitant:
        recommendations.append("Hesitation detected in typing pattern - consider taking a moment to organize thoughts")
        
        # Check specific metrics if available
        if "backspace_ratio" in hesitation.input_features:
            backspace_ratio = hesitation.input_features["backspace_ratio"]
            if backspace_ratio > 0.5:
                recommendations.append("High correction rate detected - preview feature may help refine ideas")
        
        if "correction_rate" in hesitation.input_features:
            correction_rate = hesitation.input_features["correction_rate"]
            if correction_rate > 1.0:
                recommendations.append("Multiple corrections detected - AI assistance available for clearer phrasing")
    
    if len(entities) == 0:
        recommendations.append("Add more specific details or examples to your contribution")
    elif len(entities) > 10:
        recommendations.append("Good detail! Consider organizing into key themes")
    
    if not recommendations:
        recommendations.append("Great communication! Clear and confident")
    
    return recommendations


# ---------------------------------------------------------------------------
# Unified Typing Pipeline
# ---------------------------------------------------------------------------

@router.post("/typing-process", response_model=TypingProcessResponse)
async def typing_process(request: TypingProcessRequest):
    """
    Unified typing processing pipeline.

    Runs the full AI pipeline on typed text:
    1. Entity detection (spaCy NER)
    2. Hesitation detection (Isolation Forest on typing metrics)
    3. Entity-preserving rephrasing (Groq / T5)
    4. Idea continuation prediction (Groq)
    5. Guiding question generation (Groq, context-aware)

    This is the recommended endpoint for the typing workflow.
    """
    try:
        # 1. Entity-preserving rephrase (includes entity detection + masking)
        rephrase_result = None
        entities = []
        entity_map = {}
        masked_text = None
        refined_idea = request.text
        rephrase_model = None

        try:
            rephrase_result = text_rephraser.rephrase_with_entity_preservation(request.text)
            refined_idea = rephrase_result.rephrased_text
            entities = rephrase_result.entities_detected
            entity_map = rephrase_result.entity_map
            masked_text = rephrase_result.masked_text
            rephrase_model = rephrase_result.rephrase_model
        except Exception as e:
            logger.warning(f"Rephrasing failed in typing pipeline: {e}")

        # Fallback entity extraction if rephrase didn't produce entities
        if not entities:
            try:
                raw_entities = entity_extractor.extract_entities(request.text)
                entities = [{"text": e.text, "label": e.label} for e in raw_entities]
            except Exception as e:
                logger.warning(f"Fallback entity extraction failed: {e}")

        # 2. Typing hesitation detection
        hesitation = None
        try:
            hesitation = hesitation_detector.detect_hesitation(
                delFreq=request.delFreq,
                leftFreq=request.leftFreq,
                TotTime=request.TotTime,
            )
        except Exception as e:
            logger.warning(f"Hesitation detection failed in typing pipeline: {e}")

        is_hesitant = hesitation.is_hesitant if hesitation else False

        # 3. Idea continuation predictions
        idea_continuations = []
        try:
            from inference.idea_predictor import idea_predictor
            idea_continuations = idea_predictor.predict_continuations(
                request.text, entities=entities
            )
        except Exception as e:
            logger.warning(f"Idea prediction failed: {e}")

        # 4. Guiding questions (always generate, but prioritise when hesitant)
        guiding_questions = []
        try:
            from inference.guiding_questions import guiding_question_generator
            guiding_questions = guiding_question_generator.generate_questions(
                request.text,
                entities=entities,
                hesitation_detected=is_hesitant,
            )
        except Exception as e:
            logger.warning(f"Guiding question generation failed: {e}")

        # 5. Idea continuation suggestions (short one-liners)
        suggestions = []
        try:
            from inference.idea_suggester import idea_suggester
            suggestions = idea_suggester.generate_suggestions(request.text)
        except Exception as e:
            logger.warning(f"Idea suggestions failed: {e}")

        return TypingProcessResponse(
            original_text=request.text,
            refined_idea=refined_idea,
            entities=entities,
            entity_map=entity_map,
            masked_text=masked_text,
            hesitation=hesitation,
            suggestions=suggestions,
            idea_continuations=idea_continuations,
            guiding_questions=guiding_questions,
            rephrase_model=rephrase_model,
        )

    except Exception as e:
        logger.error(f"Typing process pipeline failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Typing process pipeline failed. Please try again later.",
        )
