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
import { getEntityColor } from '../utils/entityColor';

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
        'bg-white rounded-2xl shadow-2xl shadow-gray-300/30 border border-gray-200/60',
        'transition-all duration-300 max-h-[80vh] overflow-y-auto',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
      ].join(' ')}
      role="dialog"
      aria-label="AI suggestion panel"
    >
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-brand-navy-light rounded-xl">
            <Brain size={16} className="text-brand-navy-mid" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Hesitation Detected</p>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              {confidencePct}% confidence
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss suggestion panel"
          className="p-1.5 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* ── Transcript ──────────────────────────────────── */}
      {transcript && (
        <div className="px-4 pt-3 pb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <FileText size={11} className="text-gray-400" />
            Transcript
          </p>
          <p className="text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100 italic leading-relaxed">
            "{transcript}"
          </p>
        </div>
      )}

      {rephrasedTranscript && (
        <div className="px-4 pt-1 pb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <Sparkles size={11} className="text-brand-navy-mid" />
            AI Refined{rephraseModel ? ` · ${rephraseModel}` : ''}
          </p>
          <p className="text-xs text-brand-navy bg-brand-navy-light/50 rounded-xl px-3 py-2.5 border border-blue-100/50 leading-relaxed">
            "{rephrasedTranscript}"
          </p>
        </div>
      )}

      {/* ── Entities ────────────────────────────────────── */}
      {entities.length > 0 && (
        <div className="px-4 pt-2 pb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <Tag size={11} className="text-gray-400" />
            Entities
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

      {/* ── Idea Continuations ──────────────────────────── */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <Lightbulb size={11} className="text-amber-400" />
          Continue your idea
        </p>
        <ul className="space-y-1">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => handleSuggestion(s)}
                className="w-full text-left flex items-start gap-2 px-3 py-2 rounded-xl
                           hover:bg-brand-navy-light/30 transition-colors group"
              >
                <Sparkles
                  size={12}
                  className="text-gray-300 group-hover:text-brand-navy-mid mt-0.5 flex-shrink-0"
                />
                <span className="text-xs text-gray-600 group-hover:text-gray-800 leading-relaxed">{s}</span>
                <ChevronRight
                  size={12}
                  className="ml-auto text-gray-200 group-hover:text-brand-navy-mid flex-shrink-0 mt-0.5"
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Footer micro-copy ───────────────────────────── */}
      <div className="px-4 pb-3 pt-1 text-center">
        <p className="text-xs text-gray-300 font-mono">
          Click a suggestion to add it to your idea
        </p>
      </div>
    </div>
  );
}
