"""
Idea continuation suggestions using Groq API (Llama 3.3 70B)

Previously used Gemini; migrated to Groq for reliability and free-tier access.
"""
import json
import logging

from groq import Groq
from core.config import settings

logger = logging.getLogger(__name__)


class IdeaSuggester:
    """Generate idea continuation suggestions using Groq API"""

    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            if not settings.GROQ_API_KEY:
                raise RuntimeError("GROQ_API_KEY is not set")
            self._client = Groq(api_key=settings.GROQ_API_KEY)
        return self._client

    def generate_suggestions(self, transcript: str) -> list[str]:
        """
        Generate 3 idea continuation suggestions for a hesitant transcript.

        Args:
            transcript: The transcribed speech text

        Returns:
            List of 3 suggestion strings
        """
        fallback = [
            "...consider breaking this idea into smaller actionable steps.",
            "...think about who would benefit most from this approach.",
            "...explore what the simplest version of this idea looks like.",
        ]

        if not settings.GROQ_API_KEY:
            logger.warning("GROQ_API_KEY not set, returning fallback suggestions")
            return fallback

        try:
            client = self._get_client()

            system_prompt = (
                "You are a helpful brainstorming assistant. "
                "Given what a user said, suggest natural idea continuations."
            )

            user_prompt = (
                f'A user is brainstorming and said: "{transcript}"\n\n'
                'Suggest exactly 3 short idea continuations (one sentence each, starting with "...") '
                "that naturally extend this thought for a brainstorming session.\n"
                "Return a JSON array of 3 strings only. No explanation, no markdown."
            )

            response = client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=256,
            )

            text = response.choices[0].message.content.strip()

            # Strip markdown code fences if present
            if text.startswith("```"):
                text = text.split("\n", 1)[-1]
                if text.endswith("```"):
                    text = text[:-3].strip()

            suggestions = json.loads(text)
            if isinstance(suggestions, list) and len(suggestions) >= 3:
                return [str(s) for s in suggestions[:3]]

            logger.warning("Groq returned unexpected format, using fallback")
            return fallback

        except Exception as e:
            logger.error(f"Idea suggestion generation failed: {e}")
            return fallback


# Global instance
idea_suggester = IdeaSuggester()
