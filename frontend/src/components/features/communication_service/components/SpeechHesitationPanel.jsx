/**
 * SpeechHesitationPanel
 *
 * Non-intrusive suggestion panel that slides in from the bottom-right whenever
 * the speech hesitation model returns a positive prediction.
 *
 * Now enhanced to show:
 * - Transcript from Whisper STT
 * - Detected entities as colored badges
 * - AI-generated idea continuation suggestions (from Gemini)
 * - Fallback to static prompts if no API suggestions available
 *
 * Props
 * ─────
 *  hesitationResult  {object | null}  Raw backend response (extended with transcript, entities, suggestions)
 *  onDismiss         {() => void}
 *  onSuggestionClick {(text: string) => void}  Appends chosen text to the idea area
 */
import React, { useEffect, useState } from 'react';
import { X, Sparkles, Lightbulb, ChevronRight, Brain, FileText, Tag } from 'lucide-react';

// Fallback prompts if the API doesn't return suggestions
const FALLBACK_PROMPTS = [
  'What problem does this idea solve?',
  'Who would benefit most from this?',
  'How might you validate this quickly?',
];

// Entity label → color mapping
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

export default function SpeechHesitationPanel({ hesitationResult, onDismiss, onSuggestionClick }) {
  const [visible, setVisible] = useState(false);

  // Delay appearance slightly so it doesn't flash in front of the user
  useEffect(() => {
    if (!hesitationResult) {
      setVisible(false);
      return;
    }
    const t = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(t);
  }, [hesitationResult]);

  if (!hesitationResult || !visible) return null;

  const confidence = hesitationResult.confidence_hesitation ?? 0;
  const confidencePct = Math.round(confidence * 100);
  const transcript = hesitationResult.transcript || '';
  const rephrasedTranscript = hesitationResult.rephrased_transcript || '';
  const rephraseModel = hesitationResult.rephrase_model || null;
  const entities = hesitationResult.entities || [];
  const suggestions =
    hesitationResult.suggestions && hesitationResult.suggestions.length > 0
      ? hesitationResult.suggestions
      : FALLBACK_PROMPTS;

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  const handleSuggestion = (text) => {
    if (onSuggestionClick) onSuggestionClick(text);
    handleDismiss();
  };

  return (
    <div
      className={[
        'fixed z-40 bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)]',
        'bg-white rounded-2xl shadow-2xl border border-indigo-100',
        'transition-all duration-300 max-h-[80vh] overflow-y-auto',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
      ].join(' ')}
      role="dialog"
      aria-label="AI suggestion panel"
    >
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-indigo-50 sticky top-0 bg-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 rounded-lg">
            <Brain size={16} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">You seem to be thinking…</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Hesitation detected · {confidencePct}% confidence
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss suggestion panel"
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Transcript ──────────────────────────────────── */}
      {transcript && (
        <div className="px-4 pt-3 pb-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <FileText size={11} className="text-gray-400" />
            What you said
          </p>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 italic">
            "{transcript}"
          </p>
        </div>
      )}

      {rephrasedTranscript && (
        <div className="px-4 pt-1 pb-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <Sparkles size={11} className="text-indigo-400" />
            AI refined{rephraseModel ? ` (${rephraseModel})` : ''}
          </p>
          <p className="text-sm text-gray-800 bg-indigo-50 rounded-xl px-3 py-2 border border-indigo-100">
            "{rephrasedTranscript}"
          </p>
        </div>
      )}

      {/* ── Entities ────────────────────────────────────── */}
      {entities.length > 0 && (
        <div className="px-4 pt-2 pb-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <Tag size={11} className="text-gray-400" />
            Detected entities
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

      {/* ── Idea Continuations ──────────────────────────── */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
          <Lightbulb size={11} className="text-amber-400" />
          Continue your idea…
        </p>
        <ul className="space-y-1.5">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => handleSuggestion(s)}
                className="w-full text-left flex items-start gap-2 px-3 py-2 rounded-xl
                           bg-indigo-50 hover:bg-indigo-100 transition-colors group"
              >
                <Sparkles
                  size={14}
                  className="text-indigo-400 group-hover:text-indigo-600 mt-0.5 flex-shrink-0"
                />
                <span className="text-xs text-gray-700 group-hover:text-gray-900">{s}</span>
                <ChevronRight
                  size={12}
                  className="ml-auto text-indigo-300 group-hover:text-indigo-500 flex-shrink-0 mt-0.5"
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Footer micro-copy ───────────────────────────── */}
      <div className="px-4 pb-3 pt-1 text-center">
        <p className="text-xs text-gray-400">
          Click any suggestion to add it as a starting point
        </p>
      </div>
    </div>
  );
}
