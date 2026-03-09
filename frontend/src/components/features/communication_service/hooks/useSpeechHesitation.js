/**
 * useSpeechHesitation Hook
 *
 * Manages the full audio-capture → backend-predict → hesitation-reaction lifecycle.
 *
 * Recording strategy
 * ──────────────────
 * • Uses the browser's MediaRecorder API to record audio into a Blob.
 * • Audio is collected continuously while the mic is active.
 * • When stop() is called the full recording is sent to the backend once,
 *   which runs hesitation detection + Whisper transcription + NER + suggestions.
 *
 * Returned state & controls
 * ─────────────────────────
 *   isRecording       – mic is active
 *   isProcessing      – HTTP request in-flight (after stop, before result)
 *   hesitationResult  – last result from the backend
 *   hesitationDetected – boolean shortcut
 *   error             – string | null
 *   startRecording()  – begin capture
 *   stopRecording()   – stop capture & send
 *   dismissHesitation() – clear the panel
 *   audioLevel        – 0-100 number, live volume (for waveform animation)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { detectSpeechHesitation } from '../api/brainstormApi';

const TARGET_SAMPLE_RATE = 16000; // model expects 16 kHz

const SUPPORTED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
];

function getSupportedMimeType() {
  return SUPPORTED_MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}

// ---------------------------------------------------------------------------
// Audio conversion helpers
// ---------------------------------------------------------------------------

/**
 * Decode a Blob of any browser-supported audio format into an AudioBuffer.
 */
async function decodeAudioBlob(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const ctx = new AudioContext();
  try {
    return await ctx.decodeAudioData(arrayBuffer);
  } finally {
    ctx.close();
  }
}

/**
 * Resample an AudioBuffer to TARGET_SAMPLE_RATE and return a mono Float32Array.
 */
async function resampleMono(audioBuffer) {
  const targetLength = Math.ceil(audioBuffer.duration * TARGET_SAMPLE_RATE);
  const offlineCtx = new OfflineAudioContext(1, targetLength, TARGET_SAMPLE_RATE);
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);
  const rendered = await offlineCtx.startRendering();
  return rendered.getChannelData(0); // Float32Array, mono, 16 kHz
}

/** Write a 4-char ASCII string into a DataView at the given byte offset. */
function writeStr(view, offset, str) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

/**
 * Encode a mono Float32Array at TARGET_SAMPLE_RATE as a 16-bit PCM WAV Blob.
 * librosa / soundfile can always read this format.
 */
function encodeWAV(samples) {
  const numSamples = samples.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  writeStr(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(view, 8, 'WAVE');
  writeStr(view, 12, 'fmt ');
  view.setUint32(16, 16, true);                        // PCM chunk size
  view.setUint16(20, 1, true);                         // PCM format
  view.setUint16(22, 1, true);                         // mono
  view.setUint32(24, TARGET_SAMPLE_RATE, true);
  view.setUint32(28, TARGET_SAMPLE_RATE * 2, true);    // byte rate
  view.setUint16(32, 2, true);                         // block align
  view.setUint16(34, 16, true);                        // bits per sample
  writeStr(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  let off = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    off += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Convert a Blob of any browser-recorded audio to a 16-bit mono 16 kHz WAV Blob
 * that librosa/soundfile can read without ffmpeg.
 */
async function toWAV(blob) {
  const audioBuffer = await decodeAudioBlob(blob);
  const samples = await resampleMono(audioBuffer);
  return encodeWAV(samples);
}

export default function useSpeechHesitation(sessionId = null) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hesitationResult, setHesitationResult] = useState(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [error, setError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const shouldStopRecognitionRef = useRef(false);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // Use a ref to track recording state so that the recognition.onend
  // handler always sees the latest value (avoids stale closure).
  const isRecordingRef = useRef(false);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

  const startLiveTranscription = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) {
          finalTranscriptRef.current = `${finalTranscriptRef.current} ${transcript}`.trim();
        } else {
          interim += transcript;
        }
      }
      const combined = `${finalTranscriptRef.current} ${interim}`.trim();
      setLiveTranscript(combined);
    };

    recognition.onerror = (event) => {
      // Non-fatal; audio recording + backend transcription still continue.
      console.warn('Live speech transcription error:', event.error);
    };

    recognition.onend = () => {
      // Read from ref to avoid stale closure over isRecording state.
      if (isRecordingRef.current && !shouldStopRecognitionRef.current) {
        try {
          recognition.start();
        } catch {
          // Ignore restart errors from browser speech engine timing.
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      // Ignore start errors (permission/race). Backend transcription still works.
    }
  }, []); // No deps — isRecording is read from isRecordingRef

  const stopLiveTranscription = useCallback(() => {
    shouldStopRecognitionRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  // ── Audio level polling ───────────────────────────────────────────
  const startLevelMonitor = useCallback((stream) => {
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = { ctx, analyser };

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(buffer);
        const avg = buffer.reduce((s, v) => s + v, 0) / buffer.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch {
      // AudioContext not critical — silence the error
    }
  }, []);

  const stopLevelMonitor = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (analyserRef.current?.ctx) analyserRef.current.ctx.close().catch(() => {});
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  // ── Send accumulated audio to backend ────────────────────────────
  const sendChunks = useCallback(
    async (chunks, mimeType) => {
      if (!chunks.length) return;
      const rawBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
      // Skip very short clips (< 1 KB) — they are too small to decode reliably
      if (rawBlob.size < 1024) return;
      setIsProcessing(true);
      try {
        // Convert the browser's native format (WebM/Opus etc.) → WAV so that
        // librosa/soundfile on the backend can decode it without ffmpeg.
        const wavBlob = await toWAV(rawBlob);
        const result = await detectSpeechHesitation(wavBlob, sessionId);
        setHesitationResult(result);
        setError(null);
      } catch (err) {
        console.error('Speech hesitation detection error:', err);
        setError('Could not analyse audio. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    },
    [sessionId],
  );

  // ── Start recording ───────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    setError(null);
    setHesitationResult(null);
    setLiveTranscript('');
    finalTranscriptRef.current = '';
    shouldStopRecognitionRef.current = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone access is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startLevelMonitor(stream);

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(100); // collect chunks every 100 ms
      setIsRecording(true);
      startLiveTranscription();
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow microphone access and try again.');
      } else {
        setError('Could not start recording: ' + err.message);
      }
    }
  }, [startLevelMonitor, sendChunks, startLiveTranscription]);

  // ── Stop recording ────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    stopLevelMonitor();
    stopLiveTranscription();

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      const mimeType = recorder.mimeType;
      recorder.onstop = () => {
        sendChunks([...chunksRef.current], mimeType);
        chunksRef.current = [];
      };
      recorder.stop();
    }

    // Release mic
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;

    setIsRecording(false);
  }, [stopLevelMonitor, stopLiveTranscription, sendChunks]);

  // ── Dismiss the hesitation panel ─────────────────────────────────
  const dismissHesitation = useCallback(() => {
    setHesitationResult(null);
    setError(null);
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopLevelMonitor();
      stopLiveTranscription();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [stopLevelMonitor, stopLiveTranscription]);

  const hesitationDetected =
    hesitationResult?.prediction === 1 || hesitationResult?.label === 'hesitation_detected';

  return {
    isRecording,
    isProcessing,
    hesitationResult,
    hesitationDetected,
    liveTranscript,
    error,
    audioLevel,
    startRecording,
    stopRecording,
    dismissHesitation,
  };
}
