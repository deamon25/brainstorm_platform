/**
 * Idea Capture Component (Screen 1)
 * Two-column layout: Idea Workspace (left) + AI Assistant Panel (right)
 * Features: typing behavior tracking, 3s pause detection, voice input, AI suggestions
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Lightbulb, 
  UserX, 
  User, 
  Send, 
  Loader2, 
  AlertCircle,
  Keyboard,
  Brain,
} from 'lucide-react';
import useBrainstormStore from '../store/brainstormStore';
import { processIdeaForPreview, processTypingPipeline } from '../api/brainstormApi';
import useSpeechHesitation from '../hooks/useSpeechHesitation';
import SpeechMicButton from './SpeechMicButton';
import AIAssistantPanel from './AIAssistantPanel';

const TYPING_PAUSE_THRESHOLD = 3000; // 3 seconds pause triggers AI assist

const IdeaCapture = () => {
  const [ideaText, setIdeaText] = useState('');
  const [typingStatus, setTypingStatus] = useState('idle'); // 'idle' | 'typing' | 'paused'
  const [localError, setLocalError] = useState(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const pauseTimeoutRef = useRef(null);
  const lastAiTextRef = useRef('');
  
  const {
    isAnonymous,
    setIsAnonymous,
    isLoading,
    setIsLoading,
    setError,
    setDraftIdea,
    setPreviewData,
    setCurrentScreen,
    resetTypingMetrics,
    incrementDelFreq,
    incrementLeftFreq,
    getTypingMetricsForApi,
    currentSession,
    aiAssistant,
    setAiAssistant,
    showAiAssistant,
    hideAiAssistant,
    resetAiAssistant,
  } = useBrainstormStore();

  // ── Speech hesitation hook ────────────────────────────────────────
  const sessionId = currentSession?._id || currentSession?.id || null;
  const {
    isRecording,
    hesitationResult,
    hesitationDetected,
    liveTranscript,
    error: speechError,
    audioLevel,
    startRecording,
    stopRecording,
    dismissHesitation,
  } = useSpeechHesitation(sessionId);

  // When AI continuation or question is clicked, append to idea text
  const handleContinuationClick = useCallback((text) => {
    setIdeaText((prev) => (prev.trim() ? prev.trimEnd() + ' ' + text : text));
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const handleQuestionClick = useCallback((question) => {
    // Add the question as context to the idea
    setIdeaText((prev) => {
      const prefix = prev.trim() ? prev.trimEnd() + '\n\n' : '';
      return prefix + '→ ' + question;
    });
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const handleAcceptRephrase = useCallback((text) => {
    setIdeaText(text);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  // ── Speech result → AI panel + textarea ───────────────────────────
  const lastAppliedTranscript = useRef('');
  useEffect(() => {
    if (!hesitationResult) return;
    // Put the RAW transcript in the textarea — the rephrased version
    // only goes into the AI assistant panel for the user to accept.
    const rawTranscript = hesitationResult.transcript || '';
    if (rawTranscript && rawTranscript !== lastAppliedTranscript.current) {
      lastAppliedTranscript.current = rawTranscript;
      setIdeaText(rawTranscript);
    }

    // Populate AI assistant with speech results
    setAiAssistant({
      isVisible: true,
      isProcessing: false,
      refinedIdea: hesitationResult.rephrased_transcript || '',
      entities: hesitationResult.entities || [],
      suggestions: hesitationResult.suggestions || [],
      ideaContinuations: hesitationResult.idea_continuations || [],
      guidingQuestions: hesitationResult.guiding_questions || [],
      hesitation: {
        is_hesitant: hesitationResult.prediction === 1,
        score: hesitationResult.prediction === 1
          ? hesitationResult.confidence_hesitation
          : hesitationResult.confidence_fluent,
        confidence_fluent: hesitationResult.confidence_fluent,
        confidence_hesitation: hesitationResult.confidence_hesitation,
        source: 'voice',
      },
      rephraseModel: hesitationResult.rephrase_model || null,
    });
  }, [hesitationResult, setAiAssistant]);

  // Show live transcript while recording.
  // We track liveTranscript changes and always push them to the textarea.
  // The guard against stale updates is the ref comparison, not isRecording state,
  // because React may batch setState and deliver transcript updates before
  // isRecording becomes true.
  const lastLiveTranscriptRef = useRef('');
  useEffect(() => {
    if (!liveTranscript || liveTranscript === lastLiveTranscriptRef.current) return;
    lastLiveTranscriptRef.current = liveTranscript;
    setIdeaText(liveTranscript);
  }, [liveTranscript]);

  // Initialize typing metrics on mount
  useEffect(() => {
    resetTypingMetrics();
    return () => {
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [resetTypingMetrics]);

  // ── Typing pause detection (3s) → auto-trigger AI assist ─────────
  const triggerAiAssist = useCallback(async (text) => {
    if (!text.trim() || text.trim().length < 5) return;
    if (text.trim() === lastAiTextRef.current) return;
    lastAiTextRef.current = text.trim();

    setAiAssistant({ isProcessing: true, isVisible: true });

    try {
      const metrics = getTypingMetricsForApi();
      if (metrics.TotTime < 500) metrics.TotTime = 1000;

      const result = await processTypingPipeline(text.trim(), metrics, sessionId);

      setAiAssistant({
        isProcessing: false,
        isVisible: true,
        refinedIdea: result.refined_idea || '',
        entities: result.entities || [],
        suggestions: result.suggestions || [],
        ideaContinuations: result.idea_continuations || [],
        guidingQuestions: result.guiding_questions || [],
        hesitation: result.hesitation
          ? { ...result.hesitation, source: 'typing' }
          : null,
        rephraseModel: result.rephrase_model || null,
      });
    } catch (err) {
      console.error('AI assist failed:', err);
      setAiAssistant({ isProcessing: false });
    }
  }, [getTypingMetricsForApi, sessionId, setAiAssistant]);

  // Track keyboard events for hesitation detection + pause detection
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Backspace' || e.key === 'Delete') incrementDelFreq();
    if (e.key === 'ArrowLeft') incrementLeftFreq();
    
    setTypingStatus('typing');
    
    // Short timeout for typing status display
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setTypingStatus('idle'), 1500);

    // 3-second pause detection
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      setTypingStatus('paused');
      // Auto-trigger AI when user pauses for 3 seconds
      const currentText = textareaRef.current?.value || '';
      if (currentText.trim().length >= 5) {
        triggerAiAssist(currentText);
      }
    }, TYPING_PAUSE_THRESHOLD);
  }, [incrementDelFreq, incrementLeftFreq, triggerAiAssist]);

  const handleTextChange = (e) => {
    setIdeaText(e.target.value);
    setLocalError(null);
  };

  const handleSubmit = async () => {
    if (!ideaText.trim()) {
      setLocalError('Please enter your idea before submitting');
      return;
    }
    if (ideaText.trim().length < 5) {
      setLocalError('Your idea should be at least 5 characters long');
      return;
    }

    setIsLoading(true);
    setLocalError(null);

    try {
      const metrics = getTypingMetricsForApi();
      if (metrics.TotTime < 500) metrics.TotTime = 1000;

      const previewResult = await processIdeaForPreview(ideaText.trim(), metrics);
      
      setDraftIdea({
        original_text: ideaText.trim(),
        typing_metrics: metrics,
      });
      setPreviewData(previewResult);
      setCurrentScreen('preview');
    } catch (error) {
      console.error('Error processing idea:', error);
      setLocalError('Failed to process your idea. Please try again.');
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = useCallback(() => {
    if (ideaText.trim().length >= 5) {
      lastAiTextRef.current = '';
      triggerAiAssist(ideaText);
    }
  }, [ideaText, triggerAiAssist]);

  const getTypingStatusMessage = () => {
    switch (typingStatus) {
      case 'typing':
        return '✏️ Typing...';
      case 'paused':
        return '🤔 Thinking...';
      default:
        return '💡 Ready to capture your idea';
    }
  };

  const showAiPanel = aiAssistant.isVisible || aiAssistant.isProcessing;

  return (
    <div className="max-w-6xl mx-auto">
      <div className={`grid gap-6 transition-all duration-500 ${showAiPanel ? 'lg:grid-cols-[1fr_350px]' : 'grid-cols-1 max-w-3xl mx-auto'}`}>
        {/* ── Left: Idea Workspace ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Lightbulb className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Share Your Idea</h2>
                <p className="text-blue-100 text-sm mt-0.5">
                  Every idea matters — express yourself freely
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Error Alert */}
            {(localError || speechError) && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-red-700 text-sm">{localError || speechError}</p>
              </div>
            )}

            {/* Text Input Area */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={ideaText}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder="What's your idea? Don't worry about perfect wording — we'll help you refine it..."
                className="w-full h-44 p-4 text-gray-800 bg-gray-50 border border-gray-200 rounded-xl 
                           resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           placeholder:text-gray-400 transition-all duration-200"
                disabled={isLoading}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {ideaText.length} characters
              </div>
            </div>

            {/* Typing Status Bar */}
            <div className="mt-3 flex items-center gap-2 text-sm">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300
                ${typingStatus === 'typing' ? 'bg-green-100 text-green-700' : 
                  typingStatus === 'paused' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'}`}>
                <Keyboard size={14} />
                <span>{getTypingStatusMessage()}</span>
              </div>
              {typingStatus === 'paused' && ideaText.trim().length >= 5 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs">
                  <Brain size={12} />
                  <span>AI is analyzing...</span>
                </div>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              {/* Left side actions */}
              <div className="flex items-center gap-3">
                <SpeechMicButton
                  isRecording={isRecording}
                  audioLevel={audioLevel}
                  onStart={startRecording}
                  onStop={stopRecording}
                  disabled={isLoading}
                />
                <button
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200
                    ${isAnonymous 
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {isAnonymous ? (
                    <><UserX size={18} /><span>Anonymous</span></>
                  ) : (
                    <><User size={18} /><span>Named</span></>
                  )}
                </button>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isLoading || !ideaText.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 
                           text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30
                           hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                           transition-all duration-200"
              >
                {isLoading ? (
                  <><Loader2 className="animate-spin" size={18} /><span>Processing...</span></>
                ) : (
                  <><Send size={18} /><span>Submit Idea</span></>
                )}
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-800">
                <strong className="text-blue-900">💡 Tip:</strong> Just type naturally! 
                Pause for 3 seconds and our AI will suggest improvements, continuations, and 
                guiding questions. You'll have a chance to review before sharing.
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: AI Assistant Panel ─────────────────────────────── */}
        {showAiPanel && (
          <div className="lg:sticky lg:top-24 lg:self-start">
            <AIAssistantPanel
              isVisible={aiAssistant.isVisible}
              isProcessing={aiAssistant.isProcessing}
              refinedIdea={aiAssistant.refinedIdea}
              entities={aiAssistant.entities}
              ideaContinuations={aiAssistant.ideaContinuations}
              guidingQuestions={aiAssistant.guidingQuestions}
              suggestions={aiAssistant.suggestions}
              hesitation={aiAssistant.hesitation}
              rephraseModel={aiAssistant.rephraseModel}
              originalText={ideaText}
              onContinuationClick={handleContinuationClick}
              onQuestionClick={handleQuestionClick}
              onSuggestionClick={handleContinuationClick}
              onAcceptRephrase={handleAcceptRephrase}
              onDismiss={() => hideAiAssistant()}
              onRegenerate={handleRegenerate}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default IdeaCapture;
