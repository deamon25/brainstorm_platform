/**
 * SpeechHesitationPanel
 *
 * Non-intrusive suggestion panel that slides in from the bottom-right whenever
 * the speech hesitation model returns a positive prediction.
 *
 * Design principles
 * ─────────────────
 * • Appears after a brief delay so it doesn't interrupt the user mid-thought.
 * • Suggestions are thematic prompts to restart the user's thinking — not
 *   prescriptive answers.
 * • A single "×" dismisses the panel; it won't re-appear for the same result.
 * • Confidence score is shown subtly so power-users can gauge model certainty.
 *
 * Props
 * ─────
 *  hesitationResult  {object | null}  Raw backend response
 *  onDismiss         {() => void}
 *  onSuggestionClick {(text: string) => void}  Appends chosen text to the idea area
 */
import React, { useEffect, useState } from 'react';
import { X, Sparkles, Lightbulb, ChevronRight, Brain } from 'lucide-react';

// Rotating banks of prompts.  The displayed set is chosen based on the
// confidence level so high-confidence gets more direct nudges.
const PROMPT_BANKS = {
  high: [
    'What problem does this idea solve?',
    'Who would benefit most from this?',
    'How might you validate this quickly?',
    "What's the simplest version of this idea?",
    'What related approaches have you seen before?',
  ],
  low: [
    'Take your time — what were you about to say?',
    'What sparked this thought?',
    'Can you describe the core of the idea in one sentence?',
    'What would make this idea even better?',
    "What's the first step someone would take?",
  ],
};

const EXAMPLE_DIRECTIONS = [
  'AI collaboration platform',
  'Idea evaluation tools',
  'Brainstorming with guided prompts',
  'Community-driven feedback loops',
  'Rapid prototype challenges',
];

function pickSuggestions(confidence = 0.5) {
  const bank = confidence >= 0.75 ? PROMPT_BANKS.high : PROMPT_BANKS.low;
  // Stable but varied: pick 3 prompts seeded by current minute so they rotate
  // every minute but don't jump on every render.
  const seed = Math.floor(Date.now() / 60000) % bank.length;
  return [bank[seed % bank.length], bank[(seed + 1) % bank.length], bank[(seed + 2) % bank.length]];
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
  const suggestions = pickSuggestions(confidence);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300); // wait for fade-out animation
  };

  const handleSuggestion = (text) => {
    if (onSuggestionClick) onSuggestionClick(text);
    handleDismiss();
  };

  return (
    /* Slide-up panel fixed to bottom-right on larger screens; full-width strip on mobile */
    <div
      className={[
        'fixed z-40 bottom-6 right-6 w-80 max-w-[calc(100vw-2rem)]',
        'bg-white rounded-2xl shadow-2xl border border-indigo-100',
        'transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
      ].join(' ')}
      role="dialog"
      aria-label="AI suggestion panel"
    >
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-indigo-50">
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

      {/* ── Prompts ─────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Thinking prompts
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
                <Lightbulb
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

      {/* ── Related directions ──────────────────────────── */}
      <div className="px-4 pt-2 pb-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
          <Sparkles size={11} className="text-amber-400" />
          Related directions
        </p>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_DIRECTIONS.slice(0, 3).map((dir, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSuggestion(dir)}
              className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full
                         border border-amber-200 hover:bg-amber-100 hover:border-amber-300
                         transition-colors"
            >
              {dir}
            </button>
          ))}
        </div>
      </div>

      {/* ── Footer micro-copy ───────────────────────────── */}
      <div className="px-4 pb-3 text-center">
        <p className="text-xs text-gray-400">
          Click any prompt to add it as a starting point
        </p>
      </div>
    </div>
  );
}
