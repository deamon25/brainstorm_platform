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
  Sparkles,
  ArrowRight,
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
    participantId,
    incrementDelFreq,
    incrementLeftFreq,
    getTypingMetricsForApi,
    currentSession,
    aiAssistant,
    setAiAssistant,
    showAiAssistant,
    hideAiAssistant,
    resetAiAssistant,
    typingMetrics,
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
      const previewResult = await processIdeaForPreview(ideaText.trim(), metrics, sessionId, participantId);
      
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

  const showAiPanel = aiAssistant.isVisible || aiAssistant.isProcessing;

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className={`flex gap-5 transition-all duration-500 ${showAiPanel ? '' : 'max-w-3xl mx-auto'}`}>
        {/* ── Left: Idea Workspace ──────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
            {/* Compact Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-navy-light rounded-xl">
                  <Lightbulb className="text-brand-navy-mid" size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">Capture Your Idea</h2>
                  <p className="text-xs text-gray-400">Type naturally — AI activates after a 3s pause</p>
                </div>
              </div>
              {/* Typing Status Indicator */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300
                ${typingStatus === 'typing' 
                  ? 'bg-brand-teal-light text-brand-teal' 
                  : typingStatus === 'paused' 
                    ? 'bg-amber-50 text-amber-600' 
                    : 'bg-gray-50 text-gray-400'
                }`}>
                {typingStatus === 'typing' && (
                  <>
                    <div className="flex gap-0.5">
                      <span className="w-1 h-1 bg-brand-teal rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                      <span className="w-1 h-1 bg-brand-teal rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                      <span className="w-1 h-1 bg-brand-teal rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                    </div>
                    <span>Typing</span>
                  </>
                )}
                {typingStatus === 'paused' && (
                  <>
                    <Brain size={12} className="animate-pulse" />
                    <span>AI analyzing...</span>
                  </>
                )}
                {typingStatus === 'idle' && (
                  <>
                    <Keyboard size={12} />
                    <span>Ready</span>
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              {/* Error Alert */}
              {(localError || speechError) && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
                  <p className="text-red-600 text-xs leading-relaxed">{localError || speechError}</p>
                </div>
              )}

              {/* Text Input Area */}
              <div className="relative group">
                <textarea
                  ref={textareaRef}
                  value={ideaText}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  placeholder="What's your idea? Don't worry about perfect wording — we'll help you refine it..."
                  className="w-full h-48 p-4 text-gray-800 bg-gray-50/50 border border-gray-200 rounded-xl 
                             resize-none focus:ring-2 focus:ring-brand-navy-mid/15 focus:border-brand-navy-mid/30
                             focus:bg-white placeholder:text-gray-300 transition-all duration-200 text-sm leading-relaxed outline-none"
                  disabled={isLoading}
                />
                {/* Character count */}
                <div className="absolute bottom-3 right-3 font-mono text-xs text-gray-300">
                  {ideaText.length}
                </div>
              </div>

              {/* Footer Bar */}
              <div className="mt-4 flex items-center justify-between gap-3">
                {/* Left side — Metrics + Voice + Anonymous */}
                <div className="flex items-center gap-2.5">
                  {/* Typing Metrics Chips */}
                  <div className="flex items-center gap-1.5">
                    {[
                      { label: 'del', value: typingMetrics.delFreq },
                      { label: 'nav', value: typingMetrics.leftFreq },
                      { label: 'time', value: `${Math.round(typingMetrics.TotTime / 1000)}s` },
                    ].map((m, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-gray-400 font-mono text-xs">
                        {m.label} <span className="text-gray-600 font-medium">{m.value}</span>
                      </span>
                    ))}
                  </div>

                  <div className="w-px h-5 bg-gray-200"></div>

                  {/* Voice Button */}
                  <SpeechMicButton
                    isRecording={isRecording}
                    audioLevel={audioLevel}
                    onStart={startRecording}
                    onStop={stopRecording}
                    disabled={isLoading}
                  />

                  {/* Anonymous Toggle */}
                  <button
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${isAnonymous 
                        ? 'bg-purple-50 text-purple-600 border border-purple-200' 
                        : 'bg-gray-50 text-gray-400 border border-gray-200 hover:bg-gray-100'
                      }`}
                  >
                    {isAnonymous ? <UserX size={13} /> : <User size={13} />}
                    <span>{isAnonymous ? 'Anon' : 'Named'}</span>
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !ideaText.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-navy text-brand-navy-light
                             rounded-xl text-xs font-semibold shadow-lg shadow-brand-navy/15
                             hover:shadow-xl hover:shadow-brand-navy/25
                             disabled:opacity-40 disabled:cursor-not-allowed
                             transition-all duration-200"
                >
                  {isLoading ? (
                    <><Loader2 className="animate-spin" size={14} /><span>Processing...</span></>
                  ) : (
                    <><Send size={14} /><span>Submit Idea</span><ArrowRight size={14} /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: AI Assistant Panel ─────────────────────────────── */}
        {showAiPanel && (
          <div className="w-80 flex-shrink-0 lg:sticky lg:top-24 lg:self-start animate-slide-right">
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
