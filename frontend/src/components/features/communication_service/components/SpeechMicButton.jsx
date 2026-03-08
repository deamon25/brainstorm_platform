/**
 * SpeechMicButton
 *
 * Compact microphone button with:
 *  - Idle / Recording / Analysing states
 *  - Live audio-level waveform bars (animated while recording)
 *  - Smooth pulse ring animation when the mic is active
 *
 * Props
 * ─────
 *  isRecording  {boolean}
 *  isAnalysing  {boolean}
 *  audioLevel   {number}  0-100
 *  onStart      {() => void}
 *  onStop       {() => void}
 *  disabled     {boolean}
 */
import React from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

// Number of waveform bars displayed next to the button while recording
const BAR_COUNT = 5;

export default function SpeechMicButton({
  isRecording = false,
  isAnalysing = false,
  audioLevel = 0,
  onStart,
  onStop,
  disabled = false,
}) {
  const handleClick = () => {
    if (disabled || isAnalysing) return;
    isRecording ? onStop() : onStart();
  };

  // Map audioLevel (0-100) to bar heights with some randomness so adjacent bars
  // feel "alive" rather than all moving in lockstep.
  const barHeights = Array.from({ length: BAR_COUNT }, (_, i) => {
    const offset = Math.sin(i * 1.2) * 20; // phase shift per bar
    return isRecording
      ? Math.max(10, Math.min(100, audioLevel + offset))
      : 0;
  });

  return (
    <div className="flex items-center gap-2">
      {/* ── Button ─────────────────────────────── */}
      <div className="relative">
        {/* Pulse ring — shown only while recording */}
        {isRecording && (
          <span className="absolute inset-0 rounded-xl animate-ping bg-red-400 opacity-30" />
        )}

        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || isAnalysing}
          aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
          className={[
            'relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium',
            'transition-all duration-200 select-none',
            isRecording
              ? 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-200'
              : isAnalysing
              ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            (disabled || isAnalysing) ? 'opacity-60 cursor-not-allowed' : '',
          ].join(' ')}
        >
          {isAnalysing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Analysing…</span>
            </>
          ) : isRecording ? (
            <>
              <MicOff size={18} />
              <span className="text-sm">Stop</span>
            </>
          ) : (
            <>
              <Mic size={18} />
              <span className="text-sm">Voice</span>
            </>
          )}
        </button>
      </div>

      {/* ── Waveform bars ─────────────────────── */}
      {isRecording && (
        <div
          className="flex items-end gap-0.5 h-6"
          aria-hidden="true"
          title="Live audio level"
        >
          {barHeights.map((h, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-red-400 transition-all duration-75"
              style={{ height: `${Math.max(4, (h / 100) * 24)}px` }}
            />
          ))}
        </div>
      )}

      {/* ── Recording label ───────────────────── */}
      {isRecording && (
        <span className="text-xs font-medium text-red-600 animate-pulse select-none">
          Recording…
        </span>
      )}
    </div>
  );
}
