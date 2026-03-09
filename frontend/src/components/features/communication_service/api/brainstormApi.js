/**
 * Brainstorm Platform API Service
 * Handles all communication with the backend
 */
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8004';
const API_PREFIX = '/api/v1';

const api = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds for AI operations
});

// Health check
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// ============= Session APIs =============
export const createSession = async (sessionData) => {
  // Transform data to match backend schema
  const payload = {
    session_name: sessionData.name || sessionData.session_name,
    description: sessionData.description || null,
    participant_ids: sessionData.participant_ids || [],
  };
  const response = await api.post('/sessions', payload);
  return response.data;
};

export const getSessions = async () => {
  const response = await api.get('/sessions');
  // Backend returns { sessions: [...], total: number }
  return response.data.sessions || [];
};

export const getSession = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}`);
  return response.data;
};

export const getSessionStatistics = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}/statistics`);
  return response.data;
};

// ============= Idea APIs =============
export const createIdea = async (ideaData) => {
  const response = await api.post('/ideas', ideaData);
  return response.data;
};

export const getIdeas = async (sessionId = null) => {
  const params = sessionId ? { session_id: sessionId } : {};
  const response = await api.get('/ideas', { params });
  // Backend returns { ideas: [...], total: number }
  return response.data.ideas || response.data || [];
};

export const getIdea = async (ideaId) => {
  const response = await api.get(`/ideas/${ideaId}`);
  return response.data;
};

export const updateIdea = async (ideaId, updateData) => {
  const response = await api.put(`/ideas/${ideaId}`, updateData);
  return response.data;
};

export const deleteIdea = async (ideaId) => {
  const response = await api.delete(`/ideas/${ideaId}`);
  return response.data;
};

// ============= AI Processing APIs =============
export const extractEntities = async (text) => {
  const response = await api.post('/extract-entities', { text });
  return response.data;
};

export const detectHesitation = async (typingMetrics) => {
  const response = await api.post('/detect-hesitation', typingMetrics);
  return response.data;
};

/**
 * Send a recorded audio Blob to the speech hesitation backend endpoint.
 * Uses the combined transcribe-and-predict endpoint that returns
 * hesitation prediction, transcript, entities, suggestions, continuations, and guiding questions.
 */
export const detectSpeechHesitation = async (audioBlob, sessionId = null) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.wav');
  if (sessionId) formData.append('session_id', sessionId);

  const response = await api.post('/speech-hesitation/transcribe-and-predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return response.data;
};

export const rephraseText = async (text) => {
  const response = await api.post('/entity-preserving-rephrase', { text });
  return response.data;
};

/**
 * Unified typing processing pipeline.
 * Sends text + typing metrics through the full AI pipeline:
 * entity detection, hesitation, rephrasing, idea predictions, guiding questions.
 */
export const processTypingPipeline = async (text, typingMetrics = {}, sessionId = null, participantId = null) => {
  const response = await api.post('/typing-process', {
    text,
    delFreq: typingMetrics.delFreq || 0,
    leftFreq: typingMetrics.leftFreq || 0,
    TotTime: typingMetrics.TotTime || 1000,
    session_id: sessionId,
    participant_id: participantId,
  });
  return response.data;
};

const restoreEntityPlaceholders = (text = '', entityMap = {}) => {
  let restored = text;
  // Sort entity numbers descending so ENTITY_10 is handled before ENTITY_1
  const sorted = Object.entries(entityMap || {}).sort((a, b) => {
    const numA = parseInt(a[0].split('_').pop(), 10) || 0;
    const numB = parseInt(b[0].split('_').pop(), 10) || 0;
    return numB - numA;
  });
  sorted.forEach(([key, value]) => {
    const num = key.includes('_') ? key.split('_').pop() : key;
    // Match one or more ENTITY_ prefixes (possibly corrupted) followed by the number.
    // Handles: ENTITY_3, ENTITY_ENTITY_3, ENTITY_ENTITY_ENTITY_3, ENTITY 3, entity_3
    const pattern = new RegExp(`(?:ENTITY[\\s_\\-]*)+${num}(?!\\d)`, 'gi');
    restored = restored.replace(pattern, value);
  });
  return restored;
};

export const analyzeIdea = async (text, sessionId = null, participantId = null) => {
  const response = await api.post('/analyze', {
    text,
    session_id: sessionId,
    participant_id: participantId,
  });
  return response.data;
};

// ============= Combined Analysis (for Preview Mode) =============
export const processIdeaForPreview = async (text, typingMetrics) => {
  try {
    // Use unified typing pipeline for full AI processing
    const result = await processTypingPipeline(text, typingMetrics);

    const entityMap = result.entity_map || {};

    // The backend already restores entities, but apply frontend safety cleanup
    // in case any ENTITY_N tokens leaked through the LLM.
    const restoredRephrased = restoreEntityPlaceholders(
      result.refined_idea || text,
      entityMap,
    );

    return {
      success: true,
      original_text: text,
      rephrased_text: restoredRephrased,
      entities: result.entities || [],
      entity_map: entityMap,
      masked_text: result.masked_text || '',
      rephrase_model: result.rephrase_model || null,
      hesitation: result.hesitation ? {
        score: result.hesitation.hesitation_score,
        is_hesitant: result.hesitation.is_hesitant,
        metrics: result.hesitation.input_features,
      } : { score: 0, is_hesitant: false, metrics: {} },
      suggestions: result.suggestions || [],
      idea_continuations: result.idea_continuations || [],
      guiding_questions: result.guiding_questions || [],
    };
  } catch (error) {
    console.error('Error processing idea:', error);
    throw error;
  }
};

// ============= AI Clustering =============

/**
 * Cluster all ideas in a session using AI.
 * Returns thematic clusters with summaries, insights, and recommendations.
 */
export const clusterIdeas = async (sessionId) => {
  const response = await api.post('/cluster-ideas', { session_id: sessionId });
  return response.data;
};

export default api;
