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
  Check,
} from 'lucide-react';

import { getEntityColor } from '../utils/entityColor';

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
      className={`bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden
                  transition-all duration-400 ease-out
                  ${animateIn ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
    >
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-navy-mid animate-pulse"></div>
          <span className="text-xs font-semibold text-gray-700">AI Assistant</span>
          <span className="text-xs text-gray-400">
            {isProcessing ? '· analyzing' : hasContent ? '· ready' : ''}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {onRegenerate && hasContent && (
            <button
              onClick={onRegenerate}
              disabled={isProcessing}
              className="p-1.5 text-gray-300 hover:text-brand-navy-mid hover:bg-brand-navy-light rounded-lg transition-all"
              title="Regenerate"
            >
              <RefreshCw size={13} className={isProcessing ? 'animate-spin' : ''} />
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1.5 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="px-4 py-10 flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-brand-navy-light rounded-xl flex items-center justify-center">
              <Brain size={20} className="text-brand-navy-mid animate-pulse" />
            </div>
            <Sparkles size={14} className="absolute -top-1 -right-1 text-brand-navy-mid animate-bounce" />
          </div>
          <p className="text-xs text-gray-400">Analyzing your idea...</p>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-brand-navy-mid/40 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-1.5 h-1.5 bg-brand-navy-mid/40 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-1.5 h-1.5 bg-brand-navy-mid/40 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
          </div>
        </div>
      )}

      {/* Content */}
      {!isProcessing && hasContent && (
        <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
          {/* Hesitation Indicator */}
          {hesitation && (
            <div className="px-4 pt-3">
              {isHesitant ? (
                <div className="p-3 bg-hesitation-med/40 border border-amber-200/50 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
                    <span className="text-amber-700 font-medium">
                      Hesitation detected — suggestions below
                    </span>
                  </div>
                  {/* Confidence scores — shown for both voice and typing */}
                  {hesitation.source === 'voice' && (
                    <div className="flex gap-2 text-xs">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-hesitation-high/60 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                        <span className="text-hesitation-high-text font-mono text-xs">
                          Hesitation: {(hesitation.confidence_hesitation * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-hesitation-low/60 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                        <span className="text-hesitation-low-text font-mono text-xs">
                          Fluent: {(hesitation.confidence_fluent * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                  {hesitation.source === 'typing' && hesitation.hesitation_score != null && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-hesitation-bar transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round(hesitation.hesitation_score * 100))}%` }}
                        ></div>
                      </div>
                      <span className="font-mono text-amber-600 text-xs font-medium">
                        Hesitation: {hesitation.hesitation_score.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-hesitation-low/50 border border-green-200/50 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                    <span className="text-green-700 font-medium">Confident delivery</span>
                  </div>
                  {hesitation.source === 'voice' && (
                    <div className="flex gap-2 text-xs">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-hesitation-low rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        <span className="text-hesitation-low-text font-mono text-xs">
                          Fluent: {(hesitation.confidence_fluent * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-hesitation-high/40 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-300"></span>
                        <span className="text-red-500 font-mono text-xs">
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
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Sparkles size={11} className="text-brand-navy-mid" />
                Rephrased
                {rephraseModel && (
                  <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-brand-navy-light text-brand-navy-mid font-mono font-normal normal-case">
                    {rephraseModel}
                  </span>
                )}
              </p>
              <div className="p-3 bg-brand-navy-light/50 rounded-xl border border-blue-100/50">
                <p className="text-xs text-brand-navy leading-relaxed">{refinedIdea}</p>
                <div className="flex gap-1.5 mt-2.5">
                  {onAcceptRephrase && (
                    <button
                      onClick={() => onAcceptRephrase(refinedIdea)}
                      className="flex items-center gap-1 text-xs font-medium text-white bg-brand-navy px-2.5 py-1 rounded-md hover:bg-brand-navy-mid transition-colors"
                    >
                      <Check size={11} />
                      Accept
                    </button>
                  )}
                  {onDismiss && (
                    <button
                      onClick={onDismiss}
                      className="text-xs text-gray-400 border border-gray-200 px-2.5 py-1 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Entities */}
          {entities.length > 0 && (
            <div className="px-4 pt-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Tag size={11} className="text-gray-400" />
                Entities detected
              </p>
              <div className="flex flex-wrap gap-1.5">
                {entities.map((ent, i) => (
                  <span
                    key={i}
                    className={`font-mono text-xs font-medium px-2 py-0.5 rounded ${getEntityColor(ent.label)}`}
                  >
                    {ent.text}
                    <span className="ml-1 opacity-50 text-xs">{ent.label}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Idea Continuations */}
          {ideaContinuations.length > 0 && (
            <div className="px-4 pt-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Lightbulb size={11} className="text-amber-400" />
                Continue your idea
              </p>
              <div className="space-y-1">
                {ideaContinuations.map((text, i) => (
                  <button
                    key={i}
                    onClick={() => onContinuationClick?.(text)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-600 leading-relaxed
                               hover:bg-brand-navy-light/30 hover:text-brand-navy transition-all group"
                  >
                    <span className="inline-flex items-start gap-2">
                      <ArrowRight size={12} className="text-gray-300 group-hover:text-brand-navy-mid mt-0.5 flex-shrink-0" />
                      <span>{text}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Guiding Questions */}
          {guidingQuestions.length > 0 && (
            <div className="px-4 pt-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <HelpCircle size={11} className="text-purple-400" />
                Guiding questions
              </p>
              <div className="space-y-1">
                {guidingQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => onQuestionClick?.(q)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-600 leading-relaxed
                               hover:bg-purple-50 hover:text-purple-700 transition-all group"
                  >
                    <span className="inline-flex items-start gap-2">
                      <HelpCircle size={12} className="text-gray-300 group-hover:text-purple-500 mt-0.5 flex-shrink-0" />
                      <span>{q}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions (from speech) */}
          {suggestions.length > 0 && ideaContinuations.length === 0 && (
            <div className="px-4 pt-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Sparkles size={11} className="text-indigo-400" />
                Suggestions
              </p>
              <div className="space-y-1">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onSuggestionClick?.(s)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-600 leading-relaxed
                               hover:bg-indigo-50 hover:text-indigo-700 transition-all group"
                  >
                    <span className="inline-flex items-start gap-2">
                      <ChevronRight size={12} className="text-gray-300 group-hover:text-indigo-500 mt-0.5 flex-shrink-0" />
                      <span>{s}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-3 mt-1">
            <p className="text-xs text-gray-300 text-center font-mono">
              Click suggestions to append to your idea
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isProcessing && !hasContent && isVisible && (
        <div className="px-4 py-8 text-center">
          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Brain size={18} className="text-gray-300" />
          </div>
          <p className="text-xs text-gray-400">
            Start typing or speaking — AI suggestions will appear here
          </p>
        </div>
      )}
    </div>
  );
}
