# Brainstorm Platform Service

AI-powered service for analyzing and improving team brainstorming sessions with three core models:

## 🧠 Models

### 1. **Entity NER Model** (spaCy v3.8.0)
- Extracts named entities from brainstorming text
- Identifies key concepts, people, organizations, and technical terms
- Helps track important ideas across sessions

### 2. **Entity Rephraser Model** (T5 Transformer)
- Rephrases hesitant or unclear communication
- Converts passive voice to active voice
- Removes hedging language and filler words
- Improves clarity and confidence in contributions

### 3. **Hesitation Detector Model** (Scikit-learn)
- Detects hesitation patterns in communication
- Analyzes filler words, sentence fragments, and linguistic patterns
- Provides confidence scores and improvement suggestions

## 🚀 Setup

### 1. Install Dependencies

```bash
cd services/brainstorm_platform
pip install -r requirements.txt
```

### 2. Download spaCy Language Model (if needed)

```bash
python -m spacy download en_core_web_sm
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Verify Model Paths

Ensure the following model directories exist:
- `models/brainstorm_platform/entity_ner_model/`
- `models/brainstorm_platform/entity_rephraser_model/`
- `models/brainstorm_platform/hesitation_model/`

## 🏃 Running the Service

### Development Mode

```bash
# From services/brainstorm_platform directory
python -m api.main

# Or using uvicorn directly
uvicorn api.main:app --host 0.0.0.0 --port 8004 --reload
```

### Production Mode

```bash
uvicorn api.main:app --host 0.0.0.0 --port 8004 --workers 4
```

## 📡 API Endpoints

### Health Check
```
GET /api/v1/health
```

### Extract Entities
```
POST /api/v1/extract-entities
Body: { "text": "We should implement JWT authentication for the API" }
```

### Detect Hesitation
```
POST /api/v1/detect-hesitation
Body: { "text": "I think maybe we could possibly try implementing..." }
```

### Rephrase Text
```
POST /api/v1/rephrase
Body: { 
  "text": "I think maybe we should try this approach",
  "context": "Technical discussion"
}
```

### Comprehensive Analysis
```
POST /api/v1/analyze
Body: { 
  "text": "Um, I think we could maybe try implementing authentication...",
  "participant_id": "user123",
  "session_id": "session456"
}
```

## 🧪 Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/
```

## 📊 API Documentation

Once running, visit:
- Swagger UI: http://localhost:8004/docs
- ReDoc: http://localhost:8004/redoc

## 🔌 Frontend Integration

Example fetch request from React:

```javascript
const analyzeText = async (text) => {
  const response = await fetch('http://localhost:8004/api/v1/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  return await response.json();
};
```

## 📁 Project Structure

```
brainstorm_platform/
├── api/
│   ├── main.py          # FastAPI application
│   └── routes.py        # API endpoints
├── core/
│   ├── config.py        # Configuration
│   └── schemas.py       # Pydantic models
├── inference/
│   ├── model_loader.py  # Model management
│   ├── entity_extraction.py
│   ├── rephraser.py
│   └── hesitation_detector.py
├── tests/
│   └── test_api.py
├── requirements.txt
└── README.md
```

## 🐛 Troubleshooting

### Model Loading Errors
- Verify model paths in `core/config.py`
- Check that all model files exist in `models/brainstorm_platform/`
- Ensure sufficient RAM (models can be large)

### CUDA/GPU Issues
- Service will automatically fall back to CPU if CUDA unavailable
- For GPU: Install `torch` with CUDA support

### Port Already in Use
```bash
# Change PORT in .env file or use different port:
uvicorn api.main:app --port 8005
```

## 📝 License

Part of AgileSense-AI project
