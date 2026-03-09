## Brainstorm Platform — Extended Speech Pipeline: Feasibility Check & Implementation Plan

You are working inside the `deamon25/brainstorm_platform` repository. This is a full-stack AI-assisted brainstorming system with:

- **Backend**: FastAPI (Python), located in `backend/`
- **Frontend**: React + Vite + Tailwind CSS, located in `frontend/`

Please read the following existing files carefully before making any changes or suggestions:

### Existing Backend Files to Read First

- `backend/api/main.py` — FastAPI app with lifespan, 3 routers: `routes`, `storage_routes`, `speech_routes`
- `backend/api/speech_routes.py` — Existing speech hesitation endpoint: `POST /api/v1/speech-hesitation/predict` (returns `prediction`, `label`, `confidence_fluent`, `confidence_hesitation`)
- `backend/api/routes.py` — Existing NLP routes: `/extract-entities`, `/detect-hesitation`, `/rephrase`, `/rephrase-preserve-entities`
- `backend/inference/model_loader.py` — `ModelManager` class that loads: `ner_model`, `rephraser_model`, `rephraser_tokenizer`, `hesitation_model`, `speech_hesitation_model`
- `backend/inference/rephraser.py` — Current T5-based rephraser with `mask_entities()` and `restore_entities()` utilities
- `backend/inference/speech_hesitation_detector.py` — CNN + BiLSTM + Attention model for speech hesitation, uses `librosa` for audio feature extraction (40 MFCC + 40 delta-MFCC + 12 chroma)
- `backend/inference/entity_extraction.py` — spaCy-based `EntityExtractor` class
- `backend/core/config.py` — `Settings` class with model paths: `ENTITY_NER_MODEL_PATH`, `ENTITY_REPHRASER_MODEL_PATH`, `SPEECH_HESITATION_MODEL_PATH`
- `backend/core/schemas.py` — All Pydantic request/response schemas
- `backend/requirements.txt` — Current dependencies: `fastapi`, `spacy`, `transformers`, `torch`, `librosa`, `motor`, etc.

### Existing Frontend Files to Read First

- `frontend/src/App.jsx` — Main app with sidebar navigation; the brainstorm module is at `id: 'brainstorm-platform'`
- `frontend/src/` — React + Tailwind components

---

## Task: Check Feasibility and Implement 4 New Features

**Do NOT break any existing endpoints or model loading.** All additions must be backward-compatible with:
- `POST /api/v1/speech-hesitation/predict` (must keep working exactly as-is)
- `POST /api/v1/rephrase` and `POST /api/v1/rephrase-preserve-entities` (must keep working)
- `POST /api/v1/extract-entities` (must keep working)
- All MongoDB storage routes in `storage_routes.py`

---

### Feature 1: Speech Transcription (Whisper STT)

**Goal**: After the existing speech hesitation model runs, also transcribe the audio to text using OpenAI Whisper and return it in the response.

**Implementation requirements**:
1. Install `faster-whisper` (preferred over `openai-whisper` for speed) — add it to `backend/requirements.txt`
2. Add a `whisper_model` attribute to the `ModelManager` class in `backend/inference/model_loader.py`
3. Add a `load_whisper_model()` method — load `"base"` model with `compute_type="int8"` for CPU efficiency; make it optional (warn and continue if it fails)
4. Create a new file `backend/inference/transcriber.py` with a `SpeechTranscriber` class that:
   - Takes `audio_bytes: bytes` as input
   - Saves to a temp file, runs Whisper transcription, cleans up
   - Returns the transcript string
5. Add a new endpoint `POST /api/v1/speech-hesitation/transcribe-and-predict` in `backend/api/speech_routes.py` that:
   - Accepts the same `UploadFile` audio input as the existing `/predict` endpoint
   - Runs BOTH the existing `speech_hesitation_detector` AND the new `SpeechTranscriber` on the same audio bytes
   - Returns a combined response with fields: `prediction`, `label`, `confidence_fluent`, `confidence_hesitation`, `transcript`
   - Does NOT modify or remove the existing `/predict` endpoint

**New Pydantic schema needed** in `backend/core/schemas.py`:
```python
class SpeechTranscribeAndPredictResult(BaseModel):
    prediction: int
    label: str
    confidence_fluent: float
    confidence_hesitation: float
    transcript: str
```

---

### Feature 2: Entity Detection on Transcript

**Goal**: After transcription, automatically run spaCy NER on the transcript and return detected entities.

**Implementation requirements**:
1. Extend the `SpeechTranscribeAndPredictResult` schema to include:
   ```python
   entities: List[Dict[str, str]]  # [{text, label}]
   masked_transcript: str
   entity_map: Dict[str, str]
   ```
2. In the new `/transcribe-and-predict` endpoint, after getting the transcript:
   - Reuse the existing `entity_extractor` from `backend/inference/entity_extraction.py`
   - Reuse the existing `mask_entities()` function from `backend/inference/rephraser.py`
   - Run entity detection and masking on the transcript
   - Include results in the response
3. Do NOT create new NER logic — reuse what already exists in `entity_extraction.py` and `rephraser.py`

---

### Feature 3: Replace the Rephraser with OpenAI GPT API (Option 3)

**Goal**: Replace the current T5 fine-tuned rephraser (`entity_rephraser_model`) with an OpenAI GPT API call for significantly better rephrasing quality, while keeping entity preservation via the existing `mask_entities()` / `restore_entities()` pipeline.

**IMPORTANT constraints**:
- Keep `backend/inference/rephraser.py` — only modify the `rephrase_with_entity_preservation()` method inside `TextRephraser`
- Keep the `mask_entities()` and `restore_entities()` utility functions unchanged
- Keep the existing `/rephrase` and `/rephrase-preserve-entities` endpoints in `routes.py` working — just the underlying implementation changes
- The T5 model loading in `model_loader.py` should become optional (warn if missing, don't crash) since we are replacing it with the API
- Add `openai>=1.0.0` to `backend/requirements.txt`
- Add `OPENAI_API_KEY` to `backend/.env.example`
- Add `OPENAI_API_KEY: Optional[str] = None` and `OPENAI_MODEL: str = "gpt-4o-mini"` to `backend/core/config.py` Settings

**New rephrase logic in `rephrase_with_entity_preservation()`**:
1. Run spaCy NER on the input text
2. Call `mask_entities(text, doc)` to get `masked_text` and `entity_map`
3. Call OpenAI API with this prompt (use `gpt-4o-mini` by default):
   ```
   You are an Agile writing assistant helping users refine brainstorming ideas.
   Rephrase the following idea to be clearer, more professional, and complete.
   
   Rules:
   - Do NOT change, remove, or paraphrase any ENTITY_N tokens (e.g. ENTITY_1, ENTITY_2). They must appear exactly as-is in your output.
   - Keep the same meaning and intent.
   - Output only the rephrased sentence. No explanation, no extra text.
   
   Input: {masked_text}
   Output:
   ```
4. Call `restore_entities(generated_text, entity_map)` on the API response
5. Return `EntityPreservingRephraseResult` with the final text
6. Add graceful fallback: if `OPENAI_API_KEY` is not set or the API call fails, fall back to the old T5 model if loaded, otherwise raise a descriptive error

---

### Feature 4: Idea Continuation Suggestions

**Goal**: When hesitation is detected in speech, generate 3 short idea continuation prompts using the OpenAI API to help the user expand their idea.

**Implementation requirements**:
1. Create a new file `backend/inference/idea_suggester.py` with an `IdeaSuggester` class:
   - Method: `generate_suggestions(transcript: str) -> List[str]`
   - Uses the same `openai` client (reuse `settings.OPENAI_API_KEY` and `settings.OPENAI_MODEL`)
   - Prompt to use:
     ```
     A user is brainstorming and said: "{transcript}"
     
     Suggest exactly 3 short idea continuations (one sentence each, starting with "...") 
     that naturally extend this thought for a brainstorming session.
     Return a JSON array of 3 strings only. No explanation.
     ```
   - Parse the JSON array from the response; if parsing fails, return 3 simple fallback suggestions
2. Add `suggestions` field to `SpeechTranscribeAndPredictResult`:
   ```python
   suggestions: List[str] = []
   ```
3. In the `/transcribe-and-predict` endpoint:
   - Only call `idea_suggester.generate_suggestions()` if `prediction == 1` (hesitation detected)
   - If `prediction == 0` (fluent), return `suggestions: []`
4. Add a global singleton: `idea_suggester = IdeaSuggester()` at the bottom of the file

---

## Updated `.env.example` Required

Add these new lines to `backend/.env.example`:
```dotenv
# OpenAI API (used for rephrasing and idea suggestions)
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
```

---

## Updated `requirements.txt` Required

Add these new lines to `backend/requirements.txt`:
```
# Speech Transcription
faster-whisper>=1.0.0

# LLM API (rephrasing + suggestions)
openai>=1.0.0
```

---

## Frontend Integration (Optional — implement if time allows)

In the existing brainstorm module component (look for it inside `frontend/src/components/` — find the component that renders when `activeModule === 'brainstorm-platform'`):

1. After the user records audio and the `/api/v1/speech-hesitation/predict` call is made, update it to call `/api/v1/speech-hesitation/transcribe-and-predict` instead
2. Display the returned `transcript` in an editable `<textarea>` below the mic button
3. Display detected `entities` as colored badge tags (use Tailwind classes)
4. If `prediction === 1` (hesitation detected), show:
   - A "✨ Suggested Rephrasing" card — call `POST /api/v1/rephrase-preserve-entities` with the transcript text, show the result with Accept/Reject buttons
   - A "💡 Continue your idea..." panel listing the `suggestions` array — clicking one appends it to the transcript textarea
5. If `prediction === 0` (fluent), show only the transcript and entities

---

## Summary of Constraints

- ✅ All existing endpoints must continue to work
- ✅ T5 model loading must degrade gracefully (warn, don't crash) if model files are missing
- ✅ OpenAI API key must be optional — if not set, fall back to T5 or return a clear error
- ✅ Whisper model loading must be optional (warn and continue without it)
- ✅ All new inference classes must follow the same lazy-loading pattern as `EntityExtractor` and `TextRephraser` (use `model_manager` properties)
- ✅ All new Pydantic schemas go in `backend/core/schemas.py`
- ✅ All new config fields go in `backend/core/config.py` Settings class
- ✅ Do NOT rename or remove existing schema fields

Please start by reading all the files listed at the top of this prompt, then implement each feature one at a time, verifying no existing functionality is broken.