/**
 * AI Assistant Panel
 *
 * Side panel that shows AI-generated content:
 * - Rephrased suggestion
 * - Idea continuations (clickable to append)
 * - Guiding questions (when user appears stuck)
 * - Detected entities
 * - Hesitation indicator
 *
 * Appears when AI processing completes or hesitation is detected.
 * Designed to be supportive, not intrusive.
 */
import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Lightbulb,
  HelpCircle,
  Tag,
  ChevronRight,
  X,
  Brain,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

const ENTITY_COLORS = {
  PERSON: 'bg-blue-100 text-blue-700 border-blue-200',
  ORG: 'bg-green-100 text-green-700 border-green-200',
  EVENT: 'bg-purple-100 text-purple-700 border-purple-200',
  PRODUCT: 'bg-orange-100 text-orange-700 border-orange-200',
  FEATURE: 'bg-pink-100 text-pink-700 border-pink-200',
  DEFAULT: 'bg-gray-100 text-gray-700 border-gray-200',
};

function getEntityColor(label) {
  return ENTITY_COLORS[label] || ENTITY_COLORS.DEFAULT;
}

export default function AIAssistantPanel({
  isVisible = false,
  isProcessing = false,
  refinedIdea = '',
  entities = [],
  ideaContinuations = [],
  guidingQuestions = [],
  suggestions = [],
  hesitation = null,
  rephraseModel = null,
  originalText = '',
  onContinuationClick,
  onQuestionClick,
  onSuggestionClick,
  onAcceptRephrase,
  onDismiss,
  onRegenerate,
}) {
  const [activeSection, setActiveSection] = useState('all');
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isVisible) {
      requestAnimationFrame(() => setAnimateIn(true));
    } else {
      setAnimateIn(false);
    }
  }, [isVisible]);

  const hasContent = refinedIdea || ideaContinuations.length > 0 || guidingQuestions.length > 0 || suggestions.length > 0;
  const isHesitant = hesitation?.is_hesitant;

  if (!isVisible && !isProcessing) return null;

  return (
    <div
      className={`bg-white rounded-2xl border border-blue-100 shadow-lg overflow-hidden
                  transition-all duration-500 ease-out
                  ${animateIn ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
    >
      {/* Panel Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Brain size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">AI Assistant</p>
              <p className="text-xs text-blue-100">
                {isProcessing ? 'Analyzing...' : hasContent ? 'Ready to help' : 'Waiting for input'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onRegenerate && hasContent && (
              <button
                onClick={onRegenerate}
                disabled={isProcessing}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                title="Regenerate suggestions"
              >
                <RefreshCw size={14} className={isProcessing ? 'animate-spin' : ''} />
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="px-4 py-8 flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-500" size={24} />
          <p className="text-sm text-gray-500">Analyzing your idea...</p>
        </div>
      )}

      {/* Content */}
      {!isProcessing && hasContent && (
        <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
          {/* Hesitation Indicator */}
          {hesitation && (
            <div className="px-4 pt-3">
              {isHesitant ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                    <span className="text-amber-700 font-medium">
                      Hesitation detected — here are some suggestions to help
                    </span>
                  </div>
                  {/* Confidence scores — shown for both voice and typing */}
                  {hesitation.source === 'voice' && (
                    <div className="flex gap-3 text-[11px]">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-red-100 rounded-lg">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        <span className="text-red-700">
                          Hesitation: {(hesitation.confidence_hesitation * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-green-100 rounded-lg">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <span className="text-green-700">
                          Fluent: {(hesitation.confidence_fluent * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                  {hesitation.source === 'typing' && hesitation.hesitation_score != null && (
                    <div className="text-[11px] flex items-center gap-1.5 px-2 py-1 bg-amber-100 rounded-lg w-fit">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-600"></div>
                      <span className="text-amber-800">
                        Anomaly score: {hesitation.hesitation_score.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                    <span className="text-green-700 font-medium">Your idea sounds confident!</span>
                  </div>
                  {hesitation.source === 'voice' && (
                    <div className="flex gap-3 text-[11px]">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-green-100 rounded-lg">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <span className="text-green-700">
                          Fluent: {(hesitation.confidence_fluent * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-red-100 rounded-lg">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                        <span className="text-red-600">
                          Hesitation: {(hesitation.confidence_hesitation * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Rephrased Suggestion */}
          {refinedIdea && refinedIdea !== originalText && (
            <div className="px-4 pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Sparkles size={12} className="text-blue-500" />
                Refined Version
                {rephraseModel && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 normal-case font-normal">
                    {rephraseModel}
                  </span>
                )}
              </p>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm text-gray-800 leading-relaxed">{refinedIdea}</p>
                {onAcceptRephrase && (
                  <button
                    onClick={() => onAcceptRephrase(refinedIdea)}
                    className="mt-2 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <CheckCircle2 size={12} />
                    Use this version
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Idea Continuations */}
          {ideaContinuations.length > 0 && (
            <div className="px-4 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Lightbulb size={12} className="text-amber-500" />
                Idea Continuations
              </p>
              <div className="space-y-1.5">
                {ideaContinuations.map((text, i) => (
                  <button
                    key={i}
                    onClick={() => onContinuationClick?.(text)}
                    className="w-full text-left flex items-start gap-2 px-3 py-2.5 rounded-xl
                               bg-amber-50 hover:bg-amber-100 border border-amber-100
                               transition-all duration-200 group"
                  >
                    <ArrowRight size={14} className="text-amber-400 group-hover:text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-gray-700 group-hover:text-gray-900 leading-relaxed">{text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Guiding Questions */}
          {guidingQuestions.length > 0 && (
            <div className="px-4 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <HelpCircle size={12} className="text-purple-500" />
                Guiding Questions
              </p>
              <div className="space-y-1.5">
                {guidingQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => onQuestionClick?.(q)}
                    className="w-full text-left flex items-start gap-2 px-3 py-2.5 rounded-xl
                               bg-purple-50 hover:bg-purple-100 border border-purple-100
                               transition-all duration-200 group"
                  >
                    <HelpCircle size={14} className="text-purple-400 group-hover:text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-gray-700 group-hover:text-gray-900 leading-relaxed">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions (from speech) */}
          {suggestions.length > 0 && ideaContinuations.length === 0 && (
            <div className="px-4 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Sparkles size={12} className="text-indigo-500" />
                Continue Your Idea
              </p>
              <div className="space-y-1.5">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onSuggestionClick?.(s)}
                    className="w-full text-left flex items-start gap-2 px-3 py-2.5 rounded-xl
                               bg-indigo-50 hover:bg-indigo-100 border border-indigo-100
                               transition-all duration-200 group"
                  >
                    <ChevronRight size={14} className="text-indigo-400 group-hover:text-indigo-600 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-gray-700 group-hover:text-gray-900 leading-relaxed">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Entities */}
          {entities.length > 0 && (
            <div className="px-4 pt-4 pb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Tag size={12} className="text-gray-400" />
                Detected Entities
              </p>
              <div className="flex flex-wrap gap-1.5">
                {entities.map((ent, i) => (
                  <span
                    key={i}
                    className={`text-xs px-2 py-0.5 rounded-full border ${getEntityColor(ent.label)}`}
                  >
                    {ent.text}
                    <span className="ml-1 opacity-60 text-[10px]">{ent.label}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-50">
            <p className="text-[10px] text-gray-400 text-center">
              Click suggestions to add them to your idea
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isProcessing && !hasContent && isVisible && (
        <div className="px-4 py-6 text-center">
          <Lightbulb size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-xs text-gray-400">
            Start typing or speaking — AI suggestions will appear here
          </p>
        </div>
      )}
    </div>
  );
}
