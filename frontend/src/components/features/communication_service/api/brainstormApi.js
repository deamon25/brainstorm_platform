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

export const rephraseText = async (text) => {
  const response = await api.post('/entity-preserving-rephrase', { text });
  return response.data;
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
    // Run AI operations in parallel for better performance
    const [rephraseResult, hesitationResult, entitiesResult] = await Promise.all([
      rephraseText(text),
      detectHesitation(typingMetrics),
      extractEntities(text),
    ]);

    return {
      success: true,
      original_text: text,
      rephrased_text: rephraseResult.rephrased_text,
      entities: entitiesResult.entities,
      entity_map: rephraseResult.entity_map,
      masked_text: rephraseResult.masked_text,
      hesitation: {
        score: hesitationResult.hesitation_score,
        is_hesitant: hesitationResult.is_hesitant,
        metrics: hesitationResult.input_features,
      },
    };
  } catch (error) {
    console.error('Error processing idea:', error);
    throw error;
  }
};

export default api;
