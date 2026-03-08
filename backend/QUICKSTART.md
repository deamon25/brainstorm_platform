# 🚀 Brainstorm Platform Backend - Quick Start Guide

## 📋 Three Models Overview

Your `models/brainstorm_platform` folder contains:

### 1. **Entity NER Model** (`entity_ner_model/`)
- **Type**: spaCy v3.8.0 Named Entity Recognition
- **Purpose**: Extracts named entities (people, organizations, concepts) from brainstorming text
- **Input**: Raw text
- **Output**: List of entities with labels (PERSON, ORG, PRODUCT, etc.)
- **Use Case**: Track key topics and ideas mentioned during brainstorming

### 2. **Entity Rephraser Model** (`entity_rephraser_model/`)
- **Type**: T5 Transformer (Google's Text-to-Text Transfer)
- **Purpose**: Rephrases text to improve clarity and remove hesitation
- **Input**: Text with hedging/uncertain language
- **Output**: Rephrased confident text
- **Use Case**: Help team members communicate more clearly and confidently

### 3. **Hesitation Detection Model** (`hesitation_model/`)
- **Type**: Scikit-learn ML model (pickle format)
- **Purpose**: Detects hesitation patterns in communication
- **Input**: Text features (filler words, sentence fragments, etc.)
- **Output**: Hesitation score and confidence level
- **Use Case**: Identify when participants need communication support

---

## 🏗️ Backend Architecture

```
services/brainstorm_platform/
├── api/
│   ├── main.py          # FastAPI app + startup
│   └── routes.py        # REST endpoints
├── core/
│   ├── config.py        # Settings & model paths
│   └── schemas.py       # Request/Response models
├── inference/
│   ├── model_loader.py        # Load all 3 models
│   ├── entity_extraction.py  # spaCy NER wrapper
│   ├── rephraser.py           # T5 rephrasing
│   └── hesitation_detector.py # Sklearn classifier
├── tests/
│   └── test_api.py      # API tests
├── requirements.txt     # Python dependencies
├── .env.example         # Config template
├── setup.py            # Automated setup script
├── run.py              # Quick start script
└── README.md           # Documentation
```

---

## 📦 Installation Steps

### Option 1: Automated Setup (Recommended)

```powershell
# Navigate to service directory
cd d:\SLIIT\AgileSense-AI\services\brainstorm_platform

# Run setup script
python setup.py
```

### Option 2: Manual Setup

```powershell
# 1. Navigate to service directory
cd d:\SLIIT\AgileSense-AI\services\brainstorm_platform

# 2. Create virtual environment (optional but recommended)
python -m venv venv
.\venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Download spaCy language model
python -m spacy download en_core_web_sm

# 5. Create .env file
copy .env.example .env

# 6. Verify model paths exist
dir ..\..\models\brainstorm_platform
```

---

## 🚀 Running the Backend

### Quick Start

```powershell
cd services\brainstorm_platform
python run.py
```

### Development Mode (with auto-reload)

```powershell
cd services\brainstorm_platform
uvicorn api.main:app --host 0.0.0.0 --port 8004 --reload
```

### Production Mode

```powershell
uvicorn api.main:app --host 0.0.0.0 --port 8004 --workers 4
```

---

## 🔌 API Endpoints

Once running, the service provides:

### **1. Health Check**
```http
GET http://localhost:8004/api/v1/health
```

### **2. Extract Entities** (spaCy NER)
```http
POST http://localhost:8004/api/v1/extract-entities
Content-Type: application/json

{
  "text": "Apple Inc. is developing new features with Tim Cook in California."
}
```

**Response:**
```json
{
  "entities": [
    {"text": "Apple Inc.", "label": "ORG", "start": 0, "end": 10},
    {"text": "Tim Cook", "label": "PERSON", "start": 48, "end": 56},
    {"text": "California", "label": "GPE", "start": 60, "end": 70}
  ],
  "entity_count": 3,
  "text_length": 71
}
```

### **3. Detect Hesitation** (Sklearn Model)
```http
POST http://localhost:8004/api/v1/detect-hesitation
Content-Type: application/json

{
  "text": "Um, I think maybe we could possibly try implementing authentication..."
}
```

**Response:**
```json
{
  "hesitation_detected": true,
  "confidence_score": 0.87,
  "hesitation_level": "high",
  "features": {
    "hesitation_count": 3,
    "filler_ratio": 0.15,
    "avg_word_length": 5.2,
    "sentence_fragments": 0,
    "question_marks": 0,
    "repetition_count": 1,
    "passive_count": 2
  }
}
```

### **4. Rephrase Text** (T5 Model)
```http
POST http://localhost:8004/api/v1/rephrase
Content-Type: application/json

{
  "text": "I think maybe we should try implementing JWT authentication",
  "context": "Technical discussion"
}
```

**Response:**
```json
{
  "original_text": "I think maybe we should try implementing JWT authentication",
  "rephrased_text": "We should implement JWT authentication",
  "improvements": [
    "Removed hedging word: 'I think'",
    "Removed hedging word: 'maybe'",
    "Simplified sentence structure"
  ]
}
```

### **5. Comprehensive Analysis** (All 3 Models)
```http
POST http://localhost:8004/api/v1/analyze
Content-Type: application/json

{
  "text": "Um, I think maybe we could implement JWT with Node.js and Express...",
  "participant_id": "user123",
  "session_id": "session456"
}
```

**Response:**
```json
{
  "original_text": "Um, I think maybe we could implement JWT with Node.js and Express...",
  "entities": [
    {"text": "JWT", "label": "PRODUCT", "start": 42, "end": 45},
    {"text": "Node.js", "label": "PRODUCT", "start": 51, "end": 58},
    {"text": "Express", "label": "PRODUCT", "start": 63, "end": 70}
  ],
  "hesitation": {
    "hesitation_detected": true,
    "confidence_score": 0.82,
    "hesitation_level": "high",
    "features": {...}
  },
  "rephrased_suggestion": {
    "original_text": "Um, I think maybe we could implement JWT with Node.js and Express...",
    "rephrased_text": "We should implement JWT authentication using Node.js and Express.",
    "improvements": [...]
  },
  "confidence_metrics": {
    "hesitation_confidence": 0.82,
    "entity_extraction_confidence": 0.95,
    "overall_analysis_confidence": 0.885
  },
  "recommendations": [
    "Consider rephrasing to sound more confident",
    "Remove filler words and hedging language",
    "Good detail! Consider organizing into key themes"
  ]
}
```

---

## 🌐 Frontend Integration

### React/JavaScript Example

```javascript
// services/brainstormService.js
const API_BASE = 'http://localhost:8004/api/v1';

export const analyzeText = async (text) => {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  
  if (!response.ok) {
    throw new Error('Analysis failed');
  }
  
  return await response.json();
};

export const rephraseText = async (text, context = null) => {
  const response = await fetch(`${API_BASE}/rephrase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, context })
  });
  
  return await response.json();
};

// Usage in component
const handleAnalyze = async () => {
  const result = await analyzeText(userInput);
  console.log('Entities:', result.entities);
  console.log('Hesitation:', result.hesitation);
  console.log('Suggestions:', result.recommendations);
};
```

---

## 🧪 Testing

```powershell
# Run all tests
cd services\brainstorm_platform
pytest tests/ -v

# Run specific test
pytest tests/test_api.py::test_comprehensive_analysis -v

# Run with coverage
pytest --cov=. tests/
```

---

## 📊 Interactive API Documentation

After starting the service, visit:

- **Swagger UI**: http://localhost:8004/docs
- **ReDoc**: http://localhost:8004/redoc

Both provide interactive API testing interfaces.

---

## 🐛 Troubleshooting

### Issue: Models Not Loading

**Solution:**
1. Verify model paths in [core/config.py](services/brainstorm_platform/core/config.py)
2. Check models exist:
   ```powershell
   dir d:\SLIIT\AgileSense-AI\models\brainstorm_platform
   ```
3. Check file names match exactly (especially `hesitation_model .pkl` with space)

### Issue: spaCy Model Not Found

**Solution:**
```powershell
python -m spacy download en_core_web_sm
```

### Issue: CUDA/GPU Errors

**Solution:** Service automatically falls back to CPU. For GPU support:
```powershell
pip install torch --index-url https://download.pytorch.org/whl/cu118
```

### Issue: Port Already in Use

**Solution:** Change port in `.env` or command:
```powershell
uvicorn api.main:app --port 8005
```

---

## 🔗 Model Connection Flow

```
1. Startup: model_loader.py loads all 3 models into memory
   ↓
2. API Request arrives at routes.py
   ↓
3. Route calls appropriate inference module:
   - entity_extraction.py → spaCy NER
   - hesitation_detector.py → Sklearn model
   - rephraser.py → T5 transformer
   ↓
4. Results combined and returned as JSON
```

---

## 📈 Next Steps

1. ✅ **Backend is ready!** Start the service
2. 🔌 **Connect frontend**: Update API endpoints in React app
3. 🎨 **Create UI components**: Display entities, hesitation scores, suggestions
4. 🔄 **Real-time features**: Consider WebSocket for live brainstorming
5. 💾 **Add database**: Store analysis results and session history
6. 🔐 **Add auth**: Integrate with shared auth service
7. 📊 **Analytics dashboard**: Visualize team communication patterns

---

## 📞 Support

For issues specific to:
- **Model loading**: Check [inference/model_loader.py](services/brainstorm_platform/inference/model_loader.py)
- **API routes**: Check [api/routes.py](services/brainstorm_platform/api/routes.py)
- **Configuration**: Check [core/config.py](services/brainstorm_platform/core/config.py)

---

**Developer**: M.B.H. De Silva  
**Service**: Brainstorm Platform (formerly Inclusive Communication)  
**Version**: 1.0.0
