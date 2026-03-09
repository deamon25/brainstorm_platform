"""
Guiding question generator using Groq API (Llama 3.3 70B)

When a user appears stuck (hesitation detected, long pauses, incomplete sentences),
generates context-aware questions to help them continue brainstorming.
"""
import json
import logging

from groq import Groq
from core.config import settings

logger = logging.getLogger(__name__)

FALLBACK_QUESTIONS = [
    "Who would use this idea?",
    "What problem does this solve?",
    "How would this work in practice?",
    "What makes this idea unique?",
    "What features could it include?",
]


class GuidingQuestionGenerator:
    """Generate context-aware guiding questions using Groq API"""

    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            if not settings.GROQ_API_KEY:
                raise RuntimeError("GROQ_API_KEY is not set")
            self._client = Groq(api_key=settings.GROQ_API_KEY)
        return self._client

    def generate_questions(
        self,
        idea_text: str,
        entities: list[dict] = None,
        hesitation_detected: bool = False,
        count: int = 3,
    ) -> list[str]:
        """
        Generate guiding questions based on the user's idea and context.

        Args:
            idea_text: The user's current idea text
            entities: Optional detected entities for context
            hesitation_detected: Whether hesitation was detected
            count: Number of questions to generate

        Returns:
            List of guiding question strings
        """
        if not settings.GROQ_API_KEY:
            logger.warning("GROQ_API_KEY not set, returning fallback questions")
            return FALLBACK_QUESTIONS[:count]

        try:
            client = self._get_client()

            entity_context = ""
            if entities:
                entity_names = [e.get("text", "") for e in entities if e.get("text")]
                if entity_names:
                    entity_context = f"\nEntities mentioned: {', '.join(entity_names)}"

            hesitation_context = ""
            if hesitation_detected:
                hesitation_context = "\nThe user appears to be stuck or hesitating."

            system_prompt = (
                "You are a supportive brainstorming facilitator. "
                "Your job is to ask helpful questions that guide users to develop their ideas further. "
                "Questions should be open-ended, encouraging, and specific to their idea."
            )

            user_prompt = (
                f'The user\'s idea so far: "{idea_text}"{entity_context}{hesitation_context}\n\n'
                f"Generate exactly {count} guiding questions to help the user expand their idea.\n\n"
                "Rules:\n"
                "- Questions should be specific to this particular idea\n"
                "- Make them open-ended (start with Who, What, How, Why, Where, When)\n"
                "- Keep them short and clear (one sentence each)\n"
                "- Help the user think about different aspects: users, features, implementation, impact\n"
                "- Be encouraging and supportive in tone\n\n"
                f"Return a JSON array of exactly {count} question strings. No explanation, no markdown."
            )

            response = client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.6,
                max_tokens=256,
            )

            text = response.choices[0].message.content.strip()

            # Strip markdown fences if present
            if text.startswith("```"):
                text = text.split("\n", 1)[-1]
                if text.endswith("```"):
                    text = text[:-3].strip()

            questions = json.loads(text)
            if isinstance(questions, list) and len(questions) >= 1:
                return [str(q) for q in questions[:count]]

            logger.warning("Groq returned unexpected format for guiding questions")
            return FALLBACK_QUESTIONS[:count]

        except Exception as e:
            logger.error(f"Guiding question generation failed: {e}")
            return FALLBACK_QUESTIONS[:count]


# Global instance
guiding_question_generator = GuidingQuestionGenerator()
