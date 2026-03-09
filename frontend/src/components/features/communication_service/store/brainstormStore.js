/**
 * Brainstorm Platform State Management (Zustand)
 */
import { create } from 'zustand';

const useBrainstormStore = create((set, get) => ({
  // Session State
  currentSession: null,
  sessions: [],
  
  // Ideas State
  ideas: [],
  
  // UI State
  currentScreen: 'capture', // 'capture' | 'preview' | 'board' | 'clusters'
  isLoading: false,
  error: null,
  
  // Draft idea being worked on
  draftIdea: null,
  previewData: null,
  
  // AI Assistant state
  aiAssistant: {
    isVisible: false,
    isProcessing: false,
    refinedIdea: '',
    entities: [],
    suggestions: [],
    ideaContinuations: [],
    guidingQuestions: [],
    hesitation: null,
    rephraseModel: null,
  },
  
  // Typing metrics for hesitation detection
  typingMetrics: {
    delFreq: 0,
    leftFreq: 0,
    TotTime: 0,
    startTime: null,
  },
  
  // User preferences
  isAnonymous: false,
  participantId: null,
  
  // Actions
  setCurrentSession: (session) => set({ currentSession: session }),
  setSessions: (sessions) => set({ sessions }),
  
  setIdeas: (ideas) => set({ ideas }),
  addIdea: (idea) => set((state) => ({ ideas: [idea, ...state.ideas] })),
  updateIdeaInStore: (updatedIdea) => set((state) => ({
    ideas: state.ideas.map((idea) =>
      idea._id === updatedIdea._id ? updatedIdea : idea
    ),
  })),
  removeIdea: (ideaId) => set((state) => ({
    ideas: state.ideas.filter((idea) => idea._id !== ideaId),
  })),
  
  setCurrentScreen: (screen) => set({ currentScreen: screen }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  setDraftIdea: (draft) => set({ draftIdea: draft }),
  setPreviewData: (data) => set({ previewData: data }),
  
  // AI Assistant actions
  setAiAssistant: (data) => set((state) => ({
    aiAssistant: { ...state.aiAssistant, ...data },
  })),
  showAiAssistant: () => set((state) => ({
    aiAssistant: { ...state.aiAssistant, isVisible: true },
  })),
  hideAiAssistant: () => set((state) => ({
    aiAssistant: { ...state.aiAssistant, isVisible: false },
  })),
  resetAiAssistant: () => set({
    aiAssistant: {
      isVisible: false,
      isProcessing: false,
      refinedIdea: '',
      entities: [],
      suggestions: [],
      ideaContinuations: [],
      guidingQuestions: [],
      hesitation: null,
      rephraseModel: null,
    },
  }),
  
  // Typing metrics actions
  resetTypingMetrics: () => set({
    typingMetrics: {
      delFreq: 0,
      leftFreq: 0,
      TotTime: 0,
      startTime: Date.now(),
    },
  }),
  
  incrementDelFreq: () => set((state) => ({
    typingMetrics: {
      ...state.typingMetrics,
      delFreq: state.typingMetrics.delFreq + 1,
    },
  })),
  
  incrementLeftFreq: () => set((state) => ({
    typingMetrics: {
      ...state.typingMetrics,
      leftFreq: state.typingMetrics.leftFreq + 1,
    },
  })),
  
  updateTotalTime: () => set((state) => ({
    typingMetrics: {
      ...state.typingMetrics,
      TotTime: state.typingMetrics.startTime
        ? Date.now() - state.typingMetrics.startTime
        : 0,
    },
  })),
  
  getTypingMetricsForApi: () => {
    const state = get();
    return {
      delFreq: state.typingMetrics.delFreq,
      leftFreq: state.typingMetrics.leftFreq,
      TotTime: state.typingMetrics.startTime
        ? Date.now() - state.typingMetrics.startTime
        : 1000,
    };
  },
  
  setIsAnonymous: (anonymous) => set({ isAnonymous: anonymous }),
  setParticipantId: (id) => set({ participantId: id }),

  // AI Clustering state
  clustering: {
    clusters: [],
    summary: null,
    totalIdeas: 0,
    totalClusters: 0,
    isLoading: false,
    error: null,
  },
  setClustering: (data) => set((state) => ({
    clustering: { ...state.clustering, ...data },
  })),
  resetClustering: () => set({
    clustering: {
      clusters: [],
      summary: null,
      totalIdeas: 0,
      totalClusters: 0,
      isLoading: false,
      error: null,
    },
  }),
  
  // Reset all state
  resetStore: () => set({
    currentSession: null,
    ideas: [],
    currentScreen: 'capture',
    isLoading: false,
    error: null,
    draftIdea: null,
    previewData: null,
    aiAssistant: {
      isVisible: false,
      isProcessing: false,
      refinedIdea: '',
      entities: [],
      suggestions: [],
      ideaContinuations: [],
      guidingQuestions: [],
      hesitation: null,
      rephraseModel: null,
    },
    typingMetrics: {
      delFreq: 0,
      leftFreq: 0,
      TotTime: 0,
      startTime: null,
    },
  }),
}));

export default useBrainstormStore;
