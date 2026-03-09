"""
Idea continuation predictor using Groq API (Llama 3.3 70B)

Given a user's partial idea, generates possible continuations
that the user might want to explore next.
"""
import json
import logging

from groq import Groq
from core.config import settings

logger = logging.getLogger(__name__)

FALLBACK_SUGGESTIONS = [
    "collaborate with team members on this",
    "build a simple prototype first",
    "gather feedback from potential users",
    "define the core features needed",
]


class IdeaPredictor:
    """Generate idea continuation suggestions using Groq API"""

    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            if not settings.GROQ_API_KEY:
                raise RuntimeError("GROQ_API_KEY is not set")
            self._client = Groq(api_key=settings.GROQ_API_KEY)
        return self._client

    def predict_continuations(self, idea_text: str, entities: list[dict] = None, count: int = 4) -> list[str]:
        """
        Predict possible idea continuations.

        Args:
            idea_text: The user's current idea text
            entities: Optional list of detected entities for context
            count: Number of suggestions to generate (default 4)

        Returns:
            List of continuation strings
        """
        if not settings.GROQ_API_KEY:
            logger.warning("GROQ_API_KEY not set, returning fallback suggestions")
            return FALLBACK_SUGGESTIONS[:count]

        try:
            client = self._get_client()

            entity_context = ""
            if entities:
                entity_names = [e.get("text", "") for e in entities if e.get("text")]
                if entity_names:
                    entity_context = f"\nKey entities mentioned: {', '.join(entity_names)}"

            system_prompt = (
                "You are an AI brainstorming assistant. "
                "Given a user's idea, predict what they might want to say or explore next. "
                "Generate short, actionable idea extensions that naturally continue their thought."
            )

            user_prompt = (
                f'The user said: "{idea_text}"{entity_context}\n\n'
                f"Generate exactly {count} short idea continuations (each 3-8 words). "
                "These should be natural extensions of the idea that the user might want to explore.\n\n"
                "Rules:\n"
                "- Each continuation should be a short phrase (not a full sentence)\n"
                "- Make them diverse — cover different angles\n"
                "- Keep them actionable and specific to the idea\n"
                "- Do NOT repeat what the user already said\n\n"
                f"Return a JSON array of exactly {count} strings. No explanation, no markdown."
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

            # Strip markdown fences if present
            if text.startswith("```"):
                text = text.split("\n", 1)[-1]
                if text.endswith("```"):
                    text = text[:-3].strip()

            suggestions = json.loads(text)
            if isinstance(suggestions, list) and len(suggestions) >= 1:
                return [str(s) for s in suggestions[:count]]

            logger.warning("Groq returned unexpected format for idea predictions")
            return FALLBACK_SUGGESTIONS[:count]

        except Exception as e:
            logger.error(f"Idea prediction failed: {e}")
            return FALLBACK_SUGGESTIONS[:count]


# Global instance
idea_predictor = IdeaPredictor()
