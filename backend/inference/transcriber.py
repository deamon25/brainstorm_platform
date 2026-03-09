"""
Speech transcription using faster-whisper
"""
import logging
import tempfile
import os

from inference.model_loader import model_manager

logger = logging.getLogger(__name__)


class SpeechTranscriber:
    """Transcribe audio to text using Whisper"""

    @property
    def model(self):
        return model_manager.whisper_model

    def transcribe(self, audio_bytes: bytes) -> str:
        """
        Transcribe audio bytes to text.

        Args:
            audio_bytes: Raw audio file bytes (WAV, MP3, OGG, FLAC)

        Returns:
            Transcript string
        """
        if not self.model:
            raise RuntimeError("Whisper model not loaded")

        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            segments, _info = self.model.transcribe(tmp_path, beam_size=5)
            transcript = " ".join(seg.text.strip() for seg in segments).strip()
            logger.info(f"Transcribed audio: {transcript[:100]}...")
            return transcript
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)


# Global instance
speech_transcriber = SpeechTranscriber()
