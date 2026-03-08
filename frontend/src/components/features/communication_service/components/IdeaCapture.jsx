/**
 * Idea Capture Component (Screen 1)
 * Multi-mode input with typing behavior tracking
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Lightbulb, 
  Mic, 
  MicOff, 
  UserX, 
  User, 
  Send, 
  Loader2, 
  AlertCircle,
  Keyboard
} from 'lucide-react';
import useBrainstormStore from '../store/brainstormStore';
import { processIdeaForPreview } from '../api/brainstormApi';

const IdeaCapture = () => {
  const [ideaText, setIdeaText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [typingStatus, setTypingStatus] = useState('idle'); // 'idle' | 'typing' | 'analyzing'
  const [localError, setLocalError] = useState(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
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
  } = useBrainstormStore();

  // Initialize typing metrics when component mounts
  useEffect(() => {
    resetTypingMetrics();
  }, [resetTypingMetrics]);

  // Track keyboard events for hesitation detection
  const handleKeyDown = useCallback((e) => {
    // Track backspace/delete keys
    if (e.key === 'Backspace' || e.key === 'Delete') {
      incrementDelFreq();
    }
    // Track left arrow (cursor movement indicates editing/uncertainty)
    if (e.key === 'ArrowLeft') {
      incrementLeftFreq();
    }
    
    // Update typing status
    setTypingStatus('typing');
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to detect pause
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus('idle');
    }, 1500);
  }, [incrementDelFreq, incrementLeftFreq]);

  const handleTextChange = (e) => {
    setIdeaText(e.target.value);
    setLocalError(null);
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setLocalError('Voice input is not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    if (!isRecording) {
      recognition.start();
      setIsRecording(true);
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setIdeaText(prev => prev + ' ' + transcript);
      };

      recognition.onerror = (event) => {
        setLocalError('Voice recognition error: ' + event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };
    }
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
    setTypingStatus('analyzing');
    setLocalError(null);

    try {
      // Get typing metrics for hesitation analysis
      const metrics = getTypingMetricsForApi();
      
      // Ensure minimum time for valid metrics
      if (metrics.TotTime < 500) {
        metrics.TotTime = 1000; // Default to 1 second
      }

      // Process idea through AI pipeline
      const previewResult = await processIdeaForPreview(ideaText.trim(), metrics);
      
      // Store draft and preview data
      setDraftIdea({
        original_text: ideaText.trim(),
        typing_metrics: metrics,
      });
      setPreviewData(previewResult);
      
      // Navigate to preview screen (always show preview)
      setCurrentScreen('preview');
    } catch (error) {
      console.error('Error processing idea:', error);
      setLocalError('Failed to process your idea. Please try again.');
      setError(error.message);
    } finally {
      setIsLoading(false);
      setTypingStatus('idle');
    }
  };

  const getTypingStatusMessage = () => {
    switch (typingStatus) {
      case 'typing':
        return '✏️ Typing...';
      case 'analyzing':
        return '🤖 Analyzing your input...';
      default:
        return '💡 Ready to capture your idea';
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Card Container */}
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
          {localError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-700 text-sm">{localError}</p>
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
              className="w-full h-40 p-4 text-gray-800 bg-gray-50 border border-gray-200 rounded-xl 
                         resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder:text-gray-400 transition-all duration-200"
              disabled={isLoading}
            />
            
            {/* Character count */}
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {ideaText.length} characters
            </div>
          </div>

          {/* Typing Status Bar */}
          <div className="mt-3 flex items-center gap-2 text-sm">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300
              ${typingStatus === 'analyzing' ? 'bg-blue-100 text-blue-700' : 
                typingStatus === 'typing' ? 'bg-green-100 text-green-700' : 
                'bg-gray-100 text-gray-600'}`}>
              {typingStatus === 'analyzing' ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Keyboard size={14} />
              )}
              <span>{getTypingStatusMessage()}</span>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            {/* Left side actions */}
            <div className="flex items-center gap-3">
              {/* Voice Input Button */}
              <button
                onClick={handleVoiceInput}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200
                  ${isRecording 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isRecording ? (
                  <>
                    <MicOff size={18} />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Mic size={18} />
                    <span>Voice</span>
                  </>
                )}
              </button>

              {/* Anonymous Toggle */}
              <button
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200
                  ${isAnonymous 
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {isAnonymous ? (
                  <>
                    <UserX size={18} />
                    <span>Anonymous</span>
                  </>
                ) : (
                  <>
                    <User size={18} />
                    <span>Named</span>
                  </>
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
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Submit Idea</span>
                </>
              )}
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-800">
              <strong className="text-blue-900">💡 Tip:</strong> Just type naturally! 
              Our AI will help polish your idea while keeping your key points intact. 
              You'll have a chance to review before sharing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdeaCapture;
