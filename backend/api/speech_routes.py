"""
API routes for Speech Hesitation Detection
"""
import logging
from typing import List

from fastapi import APIRouter, HTTPException, UploadFile, File, status

from core.schemas import (
    SpeechHesitationBase64Request,
    SpeechHesitationResult,
    SpeechHesitationBatchResponse,
    SpeechHesitationBatchItemResult,
    SpeechHealthResponse,
    SpeechTranscribeAndPredictResult,
)
from inference.speech_hesitation_detector import speech_hesitation_detector
from inference.model_loader import model_manager

logger = logging.getLogger(__name__)

router = APIRouter()

_ALLOWED_AUDIO_TYPES = {
    "audio/wav", "audio/x-wav", "audio/wave",
    "audio/mpeg", "audio/mp3",
    "audio/ogg", "audio/flac",
    "application/octet-stream",  # generic binary — librosa will try to decode
}

_MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB per file


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@router.get(
    "/speech-hesitation/health",
    response_model=SpeechHealthResponse,
    summary="Speech Hesitation — health check",
    description="Returns whether the speech hesitation model is loaded and ready.",
)
async def speech_health():
    """Health check endpoint for the speech hesitation model."""
    loaded = model_manager.speech_hesitation_model is not None
    return SpeechHealthResponse(
        status="ok" if loaded else "unavailable",
        model="speech_hesitation",
        model_loaded=loaded,
    )


# ---------------------------------------------------------------------------
# Single-file prediction (multipart/form-data)
# ---------------------------------------------------------------------------

@router.post(
    "/speech-hesitation/predict",
    response_model=SpeechHesitationResult,
    summary="Speech Hesitation — predict from audio file",
    description=(
        "Upload a `.wav`, `.mp3`, `.ogg`, or `.flac` audio file. "
        "The model classifies it as **fluent** (`0`) or **hesitation detected** (`1`). "
        "Audio is resampled to 16 kHz before feature extraction."
    ),
)
async def predict_speech_hesitation(
    audio: UploadFile = File(..., description="Audio file (.wav, .mp3, .ogg, .flac)"),
):
    """
    Detect hesitation in an uploaded audio file.

    - **audio**: Audio file (WAV / MP3 / OGG / FLAC)

    The endpoint extracts 40 MFCCs + 40 delta-MFCCs + 12 chroma features
    over a fixed 216-frame window, then runs them through a CNN + BiLSTM +
    Attention classifier.

    **Returns:**
    - `prediction`: `0` (fluent) or `1` (hesitation detected)
    - `label`: `"fluent"` or `"hesitation_detected"`
    - `confidence_fluent`: softmax score for the fluent class
    - `confidence_hesitation`: softmax score for the hesitation class
    """
    if model_manager.speech_hesitation_model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Speech hesitation model is not loaded",
        )

    try:
        audio_bytes = await audio.read()
        if not audio_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded audio file is empty",
            )

        if len(audio_bytes) > _MAX_AUDIO_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Audio file exceeds the 10 MB size limit",
            )

        result = speech_hesitation_detector.predict_from_bytes(audio_bytes)
        logger.info(
            f"Speech hesitation prediction: {result.label} "
            f"(confidence: {result.confidence_hesitation:.4f})"
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Speech hesitation prediction failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Speech hesitation prediction failed. Please try again later.",
        )


# ---------------------------------------------------------------------------
# Combined: Transcribe + Predict + Entity Detection + Suggestions
# ---------------------------------------------------------------------------

@router.post(
    "/speech-hesitation/transcribe-and-predict",
    response_model=SpeechTranscribeAndPredictResult,
    summary="Speech Hesitation — transcribe, predict, extract entities, and suggest",
    description=(
        "Upload an audio file. The endpoint runs speech hesitation detection, "
        "Whisper transcription, spaCy entity extraction on the transcript, "
        "and (if hesitation is detected) generates idea continuation suggestions."
    ),
)
async def transcribe_and_predict(
    audio: UploadFile = File(..., description="Audio file (.wav, .mp3, .ogg, .flac)"),
):
    """
    Combined pipeline: hesitation detection + transcription + rephrasing + NER + suggestions.

    **Returns:**
    - `prediction`, `label`, `confidence_fluent`, `confidence_hesitation` — hesitation result
    - `transcript` — Whisper transcription of the audio
    - `rephrased_transcript` — AI-rephrased transcript with entities preserved
    - `rephrase_model` — model used for transcript rephrasing (`gemini` or `t5`)
    - `entities` — named entities detected in the transcript
    - `masked_transcript` — transcript with entities replaced by ENTITY_X tokens
    - `entity_map` — mapping of ENTITY_X tokens to original text
    - `suggestions` — idea continuations (only when hesitation detected)
    """
    if model_manager.speech_hesitation_model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Speech hesitation model is not loaded",
        )

    try:
        audio_bytes = await audio.read()
        if not audio_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded audio file is empty",
            )
        if len(audio_bytes) > _MAX_AUDIO_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Audio file exceeds the 10 MB size limit",
            )

        # 1. Hesitation detection (always runs)
        hesitation_result = speech_hesitation_detector.predict_from_bytes(audio_bytes)
        logger.info(
            f"Hesitation: {hesitation_result.label} "
            f"(confidence: {hesitation_result.confidence_hesitation:.4f})"
        )

        # 2. Whisper transcription
        transcript = ""
        if model_manager.whisper_model is not None:
            try:
                from inference.transcriber import speech_transcriber
                transcript = speech_transcriber.transcribe(audio_bytes)
            except Exception as e:
                logger.warning(f"Transcription failed (continuing without it): {e}")
        else:
            logger.warning("Whisper model not loaded — skipping transcription")

        # 3. Rephrase transcript + entity outputs
        entities = []
        rephrased_transcript = ""
        rephrase_model = None
        masked_transcript = ""
        entity_map = {}
        if transcript:
            try:
                from inference.rephraser import text_rephraser

                rephrase_result = text_rephraser.rephrase_with_entity_preservation(transcript)
                rephrased_transcript = rephrase_result.rephrased_text
                rephrase_model = rephrase_result.rephrase_model
                entities = rephrase_result.entities_detected
                masked_transcript = rephrase_result.masked_text or ""
                entity_map = rephrase_result.entity_map or {}
            except Exception as e:
                logger.warning(f"Transcript rephrasing failed (continuing with raw transcript): {e}")

        # Fallback entity extraction if rephrasing path did not populate entities.
        if transcript and not entities and model_manager.ner_model is not None:
            try:
                from inference.rephraser import mask_entities

                doc = model_manager.ner_model(transcript)
                entities = [{"text": ent.text, "label": ent.label_} for ent in doc.ents]
                masked_transcript, entity_map = mask_entities(transcript, doc)
            except Exception as e:
                logger.warning(f"Fallback entity extraction on transcript failed: {e}")

        # 4. Idea suggestions (only when hesitation detected)
        suggestions = []
        idea_continuations = []
        guiding_questions = []
        suggestion_seed_text = rephrased_transcript or transcript
        if suggestion_seed_text:
            # Always generate idea continuations and guiding questions
            try:
                from inference.idea_predictor import idea_predictor
                idea_continuations = idea_predictor.predict_continuations(
                    suggestion_seed_text, entities=[{"text": e["text"], "label": e["label"]} for e in entities] if entities else None
                )
            except Exception as e:
                logger.warning(f"Idea prediction failed: {e}")

            try:
                from inference.guiding_questions import guiding_question_generator
                guiding_questions = guiding_question_generator.generate_questions(
                    suggestion_seed_text,
                    entities=[{"text": e["text"], "label": e["label"]} for e in entities] if entities else None,
                    hesitation_detected=(hesitation_result.prediction == 1),
                )
            except Exception as e:
                logger.warning(f"Guiding question generation failed: {e}")

            if hesitation_result.prediction == 1:
                try:
                    from inference.idea_suggester import idea_suggester
                    suggestions = idea_suggester.generate_suggestions(suggestion_seed_text)
                except Exception as e:
                    logger.warning(f"Idea suggestion generation failed: {e}")

        return SpeechTranscribeAndPredictResult(
            prediction=hesitation_result.prediction,
            label=hesitation_result.label,
            confidence_fluent=hesitation_result.confidence_fluent,
            confidence_hesitation=hesitation_result.confidence_hesitation,
            transcript=transcript,
            rephrased_transcript=rephrased_transcript,
            rephrase_model=rephrase_model,
            entities=entities,
            masked_transcript=masked_transcript,
            entity_map=entity_map,
            suggestions=suggestions,
            idea_continuations=idea_continuations,
            guiding_questions=guiding_questions,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcribe-and-predict failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Transcribe-and-predict pipeline failed. Please try again later.",
        )


# ---------------------------------------------------------------------------
# Base64 prediction
# ---------------------------------------------------------------------------

@router.post(
    "/speech-hesitation/predict-base64",
    response_model=SpeechHesitationResult,
    summary="Speech Hesitation — predict from base64 audio",
    description=(
        "Same as `/predict` but accepts the audio encoded as a base64 string "
        "in a JSON body — useful for browser / mobile clients."
    ),
)
async def predict_speech_hesitation_base64(request: SpeechHesitationBase64Request):
    """
    Detect hesitation from base64-encoded audio.

    - **audio_base64**: Base64-encoded audio file content
    - **format**: Format hint (`wav`, `mp3`, `ogg`, `flac`) — optional, librosa auto-detects

    **Returns:** same schema as `/predict`.
    """
    if model_manager.speech_hesitation_model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Speech hesitation model is not loaded",
        )

    try:
        result = speech_hesitation_detector.predict_from_base64(request.audio_base64)
        logger.info(
            f"Speech hesitation prediction (base64): {result.label} "
            f"(confidence: {result.confidence_hesitation:.4f})"
        )
        return result

    except Exception as e:
        logger.error(f"Speech hesitation base64 prediction failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Speech hesitation prediction failed. Please try again later.",
        )


# ---------------------------------------------------------------------------
# Batch prediction
# ---------------------------------------------------------------------------

@router.post(
    "/speech-hesitation/predict-batch",
    response_model=SpeechHesitationBatchResponse,
    summary="Speech Hesitation — batch predict (up to 10 files)",
    description=(
        "Upload up to **10** audio files at once. "
        "Returns a prediction result for each file, including per-file error "
        "information if a particular file fails."
    ),
)
async def predict_speech_hesitation_batch(
    audio_files: List[UploadFile] = File(
        ..., description="Audio files (.wav, .mp3, .ogg, .flac) — up to 10"
    ),
):
    """
    Batch speech hesitation detection.

    - **audio_files**: List of audio files (max 10)

    **Returns:**
    - `results`: list of per-file predictions
    - `total`: number of files processed
    """
    if model_manager.speech_hesitation_model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Speech hesitation model is not loaded",
        )

    if not audio_files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No audio files provided",
        )

    try:
        # Read all files into (filename, bytes) pairs — cap at 10
        pairs: list[tuple[str, bytes]] = []
        for upload in audio_files[:10]:
            content = await upload.read()
            if len(content) > _MAX_AUDIO_SIZE_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File '{upload.filename}' exceeds the 10 MB size limit",
                )
            pairs.append((upload.filename or "unknown", content))

        results: list[SpeechHesitationBatchItemResult] = (
            speech_hesitation_detector.predict_batch(pairs)
        )

        logger.info(f"Batch speech hesitation: processed {len(results)} file(s)")
        return SpeechHesitationBatchResponse(results=results, total=len(results))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch speech hesitation prediction failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Batch prediction failed. Please try again later.",
        )
