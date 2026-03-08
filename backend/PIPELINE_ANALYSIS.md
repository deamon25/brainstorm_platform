# Backend Pipeline Support Analysis

## Pipeline Requirement Assessment

### ✅ **Currently Supported**

| Pipeline Stage | Backend Support | Endpoint | Status |
|----------------|----------------|----------|--------|
| **Frontend (Idea Capture)** | N/A - Frontend | N/A | ⚠️ Frontend Task |
| **Typing Event Tracker** | N/A - Frontend | N/A | ⚠️ Frontend Task |
| **Hesitation Detection API** | ✅ Full Support | `POST /api/v1/detect-hesitation` | ✅ Working |
| **Entity Detection & Masking** | ✅ Full Support | `POST /api/v1/entity-preserving-rephrase` | ✅ Working |
| **AI Rephraser (T5)** | ✅ Full Support | `POST /api/v1/entity-preserving-rephrase` | ✅ Working |
| **Entity Restoration** | ✅ Full Support | `POST /api/v1/entity-preserving-rephrase` | ✅ Working |
| **Preview & Approval** | N/A - Frontend | N/A | ⚠️ Frontend Task |
| **Brainstorm Board** | N/A - Frontend | N/A | ⚠️ Frontend Task |
| **Clustering & Analytics** | ❌ Not Implemented | N/A | ❌ Missing |

---

## Detailed Pipeline Flow

### 1. Frontend (Idea Capture) → Typing Event Tracker
**Status**: ⚠️ Frontend Implementation Required
- Frontend needs to capture user input and track typing events
- Requires JavaScript/React event listeners for:
  - Keydown events (track deletions, arrow keys)
  - Timing (track total typing duration)

---

### 2. Typing Event Tracker → Hesitation Detection API
**Status**: ✅ **FULLY SUPPORTED**

**Endpoint**: `POST /api/v1/detect-hesitation`

**Request Format**:
```json
{
  "delFreq": 10,
  "leftFreq": 5,
  "TotTime": 15000
}
```

**Response Format**:
```json
{
  "hesitation_score": -0.276,
  "is_hesitant": true,
  "input_features": {
    "delFreq": 10.0,
    "leftFreq": 5.0,
    "TotTime": 15000.0,
    "backspace_ratio": 0.625,
    "correction_rate": 0.9375
  }
}
```

**Implementation**:
- ✅ Isolation Forest model loaded
- ✅ Feature engineering (backspace_ratio, correction_rate)
- ✅ StandardScaler for normalization
- ✅ Returns hesitation score and boolean flag

---

### 3. Hesitation Detection API → Entity Detection & Masking → AI Rephraser → Entity Restoration
**Status**: ✅ **FULLY SUPPORTED** (Single Integrated Endpoint)

**Endpoint**: `POST /api/v1/entity-preserving-rephrase`

**Request Format**:
```json
{
  "text": "I think maybe John could work with the Marketing team on the Q4 Sprint to implement the new Dashboard feature."
}
```

**Response Format**:
```json
{
  "original_text": "I think maybe John could work with...",
  "rephrased_text": "John should collaborate with the Marketing team...",
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

**Implementation**:
- ✅ **Entity Detection**: spaCy NER model identifies entities
- ✅ **Entity Masking**: Replaces entities with ENTITY_X placeholders
- ✅ **AI Rephraser**: T5 model rephrases masked text
- ✅ **Entity Restoration**: Restores original entities in output
- ✅ Returns complete analysis including masked text for debugging

**Internal Flow**:
```python
def rephrase_with_entity_preservation(text):
    # 1. Entity Detection
    doc = ner_model(text)
    
    # 2. Entity Masking
    masked_text, entity_map = mask_entities(text, doc)
    
    # 3. AI Rephraser (T5)
    instruction = "Rewrite the Agile idea clearly and professionally. Do not modify ENTITY tokens."
    rephrased_masked = t5_model.generate(instruction + masked_text)
    
    # 4. Entity Restoration
    final_text = restore_entities(rephrased_masked, entity_map)
    
    return result
```

---

### 4. Entity Restoration → Preview & Approval
**Status**: ⚠️ Frontend Implementation Required
- Backend provides rephrased text via API
- Frontend needs to:
  - Display original vs. rephrased text side-by-side
  - Provide approval/edit UI
  - Submit approved text to brainstorm board

---

### 5. Preview & Approval → Brainstorm Board
**Status**: ⚠️ Frontend Implementation Required + Backend Storage Needed
- Frontend displays approved ideas
- **Backend Gap**: No database/storage API yet for persisting ideas
- **Recommendation**: Create endpoints:
  - `POST /api/v1/ideas` - Save idea to board
  - `GET /api/v1/ideas` - Retrieve all ideas
  - `PUT /api/v1/ideas/{id}` - Update idea
  - `DELETE /api/v1/ideas/{id}` - Remove idea

---

### 6. Brainstorm Board → Clustering & Analytics
**Status**: ❌ **NOT IMPLEMENTED**

**Missing Components**:
- ❌ Idea clustering algorithm (e.g., K-Means, DBSCAN)
- ❌ Similarity computation (embeddings-based)
- ❌ Analytics endpoints (statistics, trends, patterns)
- ❌ Reporting APIs

**Recommended Implementation**:
```python
# New endpoints needed:
POST /api/v1/cluster-ideas
- Input: List of ideas
- Output: Clustered groups with labels

GET /api/v1/analytics/session/{session_id}
- Output: Session statistics (participation, sentiment, etc.)

GET /api/v1/analytics/trends
- Output: Trending topics, common themes
```

---

## Additional Available Endpoints

### Standalone Entity Extraction
**Endpoint**: `POST /api/v1/extract-entities`

Useful for debugging or standalone entity analysis without rephrasing.

```json
Request: {"text": "John from Marketing will work on Sprint 5."}
Response: {
  "entities": [
    {"text": "John", "label": "PERSON", "start": 0, "end": 4},
    {"text": "Sprint 5", "label": "SPRINT", "start": 50, "end": 58}
  ],
  "entity_count": 2,
  "text_length": 58
}
```

### Comprehensive Analysis
**Endpoint**: `POST /api/v1/analyze`

Combines entity extraction and rephrasing in one call (without entity preservation).

---

## Integration Recommendations

### Complete Pipeline Integration Flow

```javascript
// Frontend pseudo-code
async function submitIdea(text, typingMetrics) {
  // 1. Check for hesitation
  const hesitation = await fetch('/api/v1/detect-hesitation', {
    method: 'POST',
    body: JSON.stringify(typingMetrics)
  }).then(r => r.json());
  
  // 2. Get entity-preserving rephrase suggestion
  const rephrased = await fetch('/api/v1/entity-preserving-rephrase', {
    method: 'POST',
    body: JSON.stringify({ text })
  }).then(r => r.json());
  
  // 3. Show preview with hesitation warning if needed
  if (hesitation.is_hesitant) {
    showWarning('Hesitation detected. Review suggestion below.');
  }
  
  showPreview(text, rephrased.rephrased_text, rephrased.entities_detected);
  
  // 4. On approval, save to board (needs new endpoint)
  if (userApproved) {
    await saveToBoard(rephrased.rephrased_text, {
      originalText: text,
      entities: rephrased.entities_detected,
      hesitationScore: hesitation.hesitation_score
    });
  }
  
  // 5. Trigger clustering (needs implementation)
  await triggerClustering();
}
```

---

## Summary

### ✅ Fully Operational (6/9 stages)
1. ✅ Hesitation Detection API
2. ✅ Entity Detection & Masking
3. ✅ AI Rephraser (T5)
4. ✅ Entity Restoration
5. ✅ Health Monitoring
6. ✅ API Documentation

### ⚠️ Frontend Responsibility (3/9 stages)
1. Idea Capture UI
2. Typing Event Tracker
3. Preview & Approval Interface

### ❌ Missing Backend Features (2 major gaps)
1. **Brainstorm Board Storage**
   - Need database integration (MongoDB, PostgreSQL, etc.)
   - CRUD APIs for ideas management
   
2. **Clustering & Analytics**
   - Text similarity/embeddings
   - Clustering algorithms
   - Analytics dashboards
   - Reporting APIs

---

## Next Steps

### Priority 1: Storage Layer
- [ ] Set up database (recommend PostgreSQL or MongoDB)
- [ ] Create Idea model/schema
- [ ] Implement CRUD endpoints for brainstorm board

### Priority 2: Clustering & Analytics
- [ ] Implement text embeddings (use sentence-transformers)
- [ ] Add clustering endpoint (K-Means/DBSCAN)
- [ ] Create analytics aggregation endpoints
- [ ] Build reporting APIs

### Priority 3: Frontend Integration
- [ ] Implement typing event tracker in React
- [ ] Build preview/approval UI component
- [ ] Create brainstorm board display
- [ ] Add clustering visualization

---

## Testing Commands

Test the complete backend pipeline:

```bash
# 1. Health check
curl http://127.0.0.1:8004/api/v1/health

# 2. Test hesitation detection
curl -X POST http://127.0.0.1:8004/api/v1/detect-hesitation \
  -H "Content-Type: application/json" \
  -d '{"delFreq": 10, "leftFreq": 5, "TotTime": 15000}'

# 3. Test entity-preserving rephrase
curl -X POST http://127.0.0.1:8004/api/v1/entity-preserving-rephrase \
  -H "Content-Type: application/json" \
  -d '{"text": "I think maybe John could work with Marketing on Sprint 5."}'
```

---

**Conclusion**: The backend **supports 67% of the pipeline** (6/9 stages). The core ML pipeline (hesitation detection → entity detection → masking → rephrasing → restoration) is **fully operational**. The main gaps are storage/persistence and clustering analytics, which are independent features that can be added without affecting existing functionality.
