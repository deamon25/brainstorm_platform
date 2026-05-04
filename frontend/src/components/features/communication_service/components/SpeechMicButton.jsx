/**
 * SpeechMicButton
 *
 * Modern mic button with:
 *  - Idle / Recording states
 *  - Live audio-level waveform bars (animated while recording)
 *  - Smooth pulse ring animation when the mic is active
 *
 * Props
 * ─────
 *  isRecording  {boolean}
 *  audioLevel   {number}  0-100
 *  onStart      {() => void}
 *  onStop       {() => void}
 *  disabled     {boolean}
 */
import React from 'react';
import { Mic, MicOff } from 'lucide-react';

// Number of waveform bars displayed next to the button while recording
const BAR_COUNT = 5;

export default function SpeechMicButton({
  isRecording = false,
  audioLevel = 0,
  onStart,
  onStop,
  disabled = false,
}) {
  const handleClick = () => {
    if (disabled) return;
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
          <span className="absolute inset-0 rounded-xl animate-ping bg-red-400 opacity-20" />
        )}

        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
          className={[
            'relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium',
            'transition-all duration-200 select-none',
            isRecording
              ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md shadow-red-200/50'
              : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        >
          {isRecording ? (
            <>
              <MicOff size={13} />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Mic size={13} />
              <span>Voice</span>
            </>
          )}
        </button>
      </div>

      {/* ── Waveform bars ─────────────────────── */}
      {isRecording && (
        <div
          className="flex items-end gap-0.5 h-5"
          aria-hidden="true"
          title="Live audio level"
        >
          {barHeights.map((h, i) => (
            <div
              key={i}
              className="w-0.5 rounded-full bg-red-400 transition-all duration-75"
              style={{ height: `${Math.max(3, (h / 100) * 20)}px` }}
            />
          ))}
        </div>
      )}

      {/* ── Recording label ───────────────────── */}
      {isRecording && (
        <span className="flex items-center gap-1.5 text-xs font-medium text-red-500 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
          REC
        </span>
      )}
    </div>
  );
}
