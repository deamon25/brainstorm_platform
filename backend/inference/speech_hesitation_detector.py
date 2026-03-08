"""
Speech hesitation detection using CNN + BiLSTM + Attention model.

Classifies an audio clip as:
  1 → hesitation detected (fillers: um, uh, er, ah, hmm, like, you know …)
  0 → fluent speech
"""
import logging
import io
import base64

import numpy as np
import librosa
import torch
import torch.nn as nn

from core.schemas import (
    SpeechHesitationResult,
    SpeechHesitationBatchItemResult,
)
from inference.model_loader import model_manager

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Model architecture — must match the saved weights exactly
# ---------------------------------------------------------------------------

class Attention(nn.Module):
    def __init__(self, hidden_dim: int):
        super().__init__()
        self.attn = nn.Linear(hidden_dim, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        weights = torch.softmax(self.attn(x), dim=1)
        context = (x * weights).sum(dim=1)
        return context


class SpeechHesitationModel(nn.Module):
    """CNN + BiLSTM + Attention classifier for speech hesitation."""

    def __init__(self, input_size: int = 92):
        super().__init__()
        self.conv1 = nn.Conv1d(input_size, 64, 3, padding=1)
        self.conv2 = nn.Conv1d(64, 128, 3, padding=1)
        self.relu = nn.ReLU()
        self.lstm = nn.LSTM(
            input_size=128,
            hidden_size=128,
            batch_first=True,
            bidirectional=True,
        )
        self.attention = Attention(256)
        self.fc = nn.Linear(256, 2)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: [batch, seq_len=216, features=92]
        x = x.permute(0, 2, 1)           # → [batch, 92, 216]
        x = self.relu(self.conv1(x))      # → [batch, 64, 216]
        x = self.relu(self.conv2(x))      # → [batch, 128, 216]
        x = x.permute(0, 2, 1)           # → [batch, 216, 128]
        lstm_out, _ = self.lstm(x)        # → [batch, 216, 256]
        x = self.attention(lstm_out)      # → [batch, 256]
        x = self.fc(x)                    # → [batch, 2]
        return x


# ---------------------------------------------------------------------------
# Feature extraction
# ---------------------------------------------------------------------------

_MAX_FRAMES = 216
_N_MFCC = 40
_SR = 16_000


def extract_features(audio: np.ndarray, sr: int) -> np.ndarray:
    """
    Extract MFCC + delta-MFCC + chroma features from raw audio.

    Args:
        audio: 1-D numpy array of audio samples.
        sr:    Sampling rate of *audio* (will be treated as already at _SR).

    Returns:
        ndarray of shape [216, 92].
    """
    audio = librosa.util.normalize(audio)

    # Pad or trim to 5 seconds at the target sample rate
    max_len = sr * 5
    if len(audio) > max_len:
        audio = audio[:max_len]
    else:
        audio = np.pad(audio, (0, max_len - len(audio)))

    # MFCC  → [40, T]
    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=_N_MFCC)
    # Delta MFCC → [40, T]
    delta = librosa.feature.delta(mfcc)
    # Chroma → [12, T]
    chroma = librosa.feature.chroma_stft(y=audio, sr=sr)

    # Stack → [92, T]
    features = np.vstack([mfcc, delta, chroma])

    # Fixed-length time axis → [92, 216]
    if features.shape[1] > _MAX_FRAMES:
        features = features[:, :_MAX_FRAMES]
    else:
        features = np.pad(features, ((0, 0), (0, _MAX_FRAMES - features.shape[1])))

    return features.T  # → [216, 92]


# ---------------------------------------------------------------------------
# Inference
# ---------------------------------------------------------------------------

def _run_inference(audio: np.ndarray, sr: int) -> SpeechHesitationResult:
    """Core inference — feature extraction → tensor → model → result."""
    model = model_manager.speech_hesitation_model
    if model is None:
        raise RuntimeError("Speech hesitation model is not loaded")

    features = extract_features(audio, sr)
    tensor = torch.tensor(features, dtype=torch.float32).unsqueeze(0)  # [1, 216, 92]

    with torch.no_grad():
        logits = model(tensor)                                     # [1, 2]
        probs = torch.softmax(logits, dim=1).squeeze(0).tolist()   # [fluent, hesitation]
        prediction = int(torch.argmax(logits, dim=1).item())

    return SpeechHesitationResult(
        prediction=prediction,
        label="hesitation_detected" if prediction == 1 else "fluent",
        confidence_fluent=round(probs[0], 4),
        confidence_hesitation=round(probs[1], 4),
    )


class SpeechHesitationDetector:
    """Thin wrapper that exposes the inference pipeline as instance methods."""

    @staticmethod
    def predict_from_audio(audio: np.ndarray, sr: int) -> SpeechHesitationResult:
        """Predict hesitation from a pre-loaded audio array.

        Args:
            audio: Raw audio samples (float32, mono).
            sr:    Sampling rate (must be 16 000 Hz).

        Returns:
            SpeechHesitationResult Pydantic model.
        """
        logger.info(f"Running speech hesitation inference on {len(audio)/sr:.2f}s clip")
        return _run_inference(audio, sr)

    @staticmethod
    def predict_from_bytes(audio_bytes: bytes) -> SpeechHesitationResult:
        """Predict hesitation from raw audio bytes (any format librosa supports).

        Args:
            audio_bytes: Raw file content bytes.

        Returns:
            SpeechHesitationResult Pydantic model.
        """
        audio, sr = librosa.load(io.BytesIO(audio_bytes), sr=_SR)
        return _run_inference(audio, sr)

    @staticmethod
    def predict_from_base64(audio_base64: str) -> SpeechHesitationResult:
        """Predict hesitation from a base64-encoded audio string.

        Args:
            audio_base64: Base64-encoded audio file content.

        Returns:
            SpeechHesitationResult Pydantic model.
        """
        audio_bytes = base64.b64decode(audio_base64)
        return SpeechHesitationDetector.predict_from_bytes(audio_bytes)

    @staticmethod
    def predict_batch(
        audio_bytes_list: list[tuple[str, bytes]]
    ) -> list[SpeechHesitationBatchItemResult]:
        """Predict hesitation for a list of (filename, bytes) tuples.

        Args:
            audio_bytes_list: Up to 10 (filename, raw_bytes) pairs.

        Returns:
            List of SpeechHesitationBatchItemResult.
        """
        results = []
        for filename, audio_bytes in audio_bytes_list[:10]:
            try:
                audio, sr = librosa.load(io.BytesIO(audio_bytes), sr=_SR)
                pred = _run_inference(audio, sr)
                results.append(
                    SpeechHesitationBatchItemResult(
                        filename=filename,
                        prediction=pred.prediction,
                        label=pred.label,
                        confidence_fluent=pred.confidence_fluent,
                        confidence_hesitation=pred.confidence_hesitation,
                    )
                )
            except Exception as e:
                logger.error(f"Failed to process {filename}: {e}")
                results.append(
                    SpeechHesitationBatchItemResult(
                        filename=filename,
                        prediction=-1,
                        label="error",
                        confidence_fluent=0.0,
                        confidence_hesitation=0.0,
                        error=str(e),
                    )
                )
        return results


# Global singleton
speech_hesitation_detector = SpeechHesitationDetector()
