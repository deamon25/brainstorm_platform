"""
Text rephrasing using T5 model (fallback) or Gemini API with entity preservation
"""
import logging
from groq import Groq
from core.config import settings
import torch
from typing import List, Dict, Tuple
import spacy

from core.schemas import RephraseResult, EntityPreservingRephraseResult
from inference.model_loader import model_manager

logger = logging.getLogger(__name__)


def mask_entities(text: str, doc: spacy.tokens.Doc) -> Tuple[str, Dict[str, str]]:
    """
    Masks recognized entities in a text with placeholder tokens (e.g., ENTITY_1).

    Uses regex word-boundary matching (\b) so that replacing single-digit
    entities like "3" does NOT corrupt previously inserted tokens like
    "ENTITY_3"  (because '_' is a word character, there is no \b between
    '_' and '3').
    """
    import re

    entity_map = {}
    masked_text = text
    
    # Sort entities by length (longest first) to avoid partial replacement issues
    sorted_ents = sorted(doc.ents, key=lambda e: len(e.text), reverse=True)
    
    for i, ent in enumerate(sorted_ents):
        key = f"ENTITY_{i+1}"
        entity_map[key] = ent.text
        # Use word boundaries so digit entities don't corrupt ENTITY_N tokens
        pattern = r'\b' + re.escape(ent.text) + r'\b'
        masked_text = re.sub(pattern, key, masked_text)
    
    return masked_text, entity_map


def restore_entities(text: str, entity_map: Dict[str, str]) -> str:
    """
    Restores original entities in a text from placeholder tokens using an entity map.

    Handles corrupted tokens produced by LLMs such as:
      ENTITY_3, ENTITY_ENTITY_3, ENTITY_ENTITY_ENTITY_3,
      ENTITY 3, entity_3, Entity-3, etc.

    Uses regex so that nested/repeated ENTITY_ prefixes are fully consumed
    and replaced with the original value — no ENTITY_ leakage.
    """
    import re

    # Sort entity numbers descending so that ENTITY_10 is handled before ENTITY_1
    sorted_items = sorted(
        entity_map.items(),
        key=lambda kv: int(kv[0].split("_")[-1]) if "_" in kv[0] else 0,
        reverse=True,
    )

    for key, value in sorted_items:
        num = key.split("_")[-1] if "_" in key else key
        # Match one or more (possibly corrupted) ENTITY prefixes followed by the number.
        # Covers: ENTITY_3, ENTITY_ENTITY_3, ENTITY_ENTITY_ENTITY_3,
        #         ENTITY 3, entity-3, ENTITY__3, etc.
        pattern = rf'(?:ENTITY[\s_\-]*)+{re.escape(num)}(?!\d)'
        text = re.sub(pattern, value, text, flags=re.IGNORECASE)

    return text


def cleanup_entity_leaks(text: str) -> str:
    """Remove any residual ENTITY_N placeholders that were not restored."""
    import re
    cleaned = re.sub(r'(?:ENTITY[\s_\-]*)+\d+', '', text, flags=re.IGNORECASE)
    # Collapse double spaces
    cleaned = re.sub(r'  +', ' ', cleaned).strip()
    return cleaned


class TextRephraser:
    """Rephrase text for clearer communication with entity preservation"""
    
    @property
    def model(self):
        """Get the rephraser model lazily from model_manager"""
        return model_manager.rephraser_model
    
    @property
    def tokenizer(self):
        """Get the tokenizer lazily from model_manager"""
        return model_manager.rephraser_tokenizer
    
    @property
    def ner_model(self):
        """Get the NER model lazily from model_manager"""
        return model_manager.ner_model
    
    @property
    def device(self):
        """Get the device to use"""
        return "cuda" if torch.cuda.is_available() else "cpu"
    
    def rephrase_with_entity_preservation(self, text: str) -> EntityPreservingRephraseResult:
        """
        Rephrase text while preserving named entities.

        Pipeline:
        1. Detect entities with spaCy and replace them with ENTITY_N placeholders
        2. Send the masked text to Groq (Llama 3.3 70B) with a strict rephrasing prompt
        3. Restore original entities into the Groq output
        4. Fall back to the local T5 model if Groq is unavailable or fails
        """
        import re

        if not self.ner_model:
            raise RuntimeError("NER model not loaded")

        # Step 1: Detect entities using spaCy
        doc = self.ner_model(text)

        # Step 2: Mask entities with placeholders
        masked_text, entity_map = mask_entities(text, doc)
        logger.info(f"Masked {len(entity_map)} entities: {list(entity_map.keys())}")
        logger.info(f"Masked text: {masked_text}")

        final_rephrased_text = None
        rephrase_model_used = None

        # ----------------------------------------------------------------
        # Step 3a: PRIMARY — Groq API (llama-3.3-70b-versatile, free tier)
        # ----------------------------------------------------------------
        if settings.GROQ_API_KEY:
            try:
                client = Groq(api_key=settings.GROQ_API_KEY)

                system_prompt = "You are an AI assistant for the Brainstorm Platform."

                user_prompt = (
                    "Your job is to rephrase user ideas clearly while preserving the original meaning.\n\n"
                    "Important rules:\n\n"
                    "1. Preserve the original idea exactly.\n"
                    "2. Do NOT introduce new concepts or tools.\n"
                    "3. Do NOT invent entities.\n"
                    "4. CRITICAL: If masked entity tokens like ENTITY_1, ENTITY_2, etc. appear in the input, "
                    "you MUST copy them EXACTLY as-is into your output. Do NOT add extra 'ENTITY_' prefixes. "
                    "Do NOT change ENTITY_1 to ENTITY_ENTITY_1. Do NOT modify, split, or remove these tokens.\n"
                    "5. Remove hesitation words such as: um, uh, maybe, like, kind of, sort of.\n"
                    "6. Improve grammar and sentence structure.\n"
                    "7. Keep the sentence concise.\n"
                    "8. Output only ONE rephrased sentence.\n"
                    "9. Do not add explanations.\n\n"
                    "Below are examples of correct rephrasing.\n\n"
                    "Example 1\n"
                    "Input:\n"
                    "\"Something that helps people think when they run out of ideas.\"\n\n"
                    "Output:\n"
                    "\"A tool that helps people generate ideas when they run out of them.\"\n\n"
                    "Example 2\n"
                    "Input:\n"
                    "\"Maybe like a platform where people can share ideas and get feedback.\"\n\n"
                    "Output:\n"
                    "\"A platform where people can share ideas and receive feedback.\"\n\n"
                    "Example 3\n"
                    "Input:\n"
                    "\"An app for students that helps organize study things.\"\n\n"
                    "Output:\n"
                    "\"An app that helps students organize their study activities.\"\n\n"
                    "Example 4\n"
                    "Input:\n"
                    "\"I was thinking maybe like AI helping you continue ideas when you pause.\"\n\n"
                    "Output:\n"
                    "\"An AI system that helps users continue their ideas when they pause.\"\n\n"
                    "Example 5\n"
                    "Input:\n"
                    "\"A PRODUCT_1 that helps students organize their study schedule.\"\n\n"
                    "Output:\n"
                    "\"A PRODUCT_1 designed to help students organize their study schedules.\"\n\n"
                    "Now rephrase the following sentence.\n\n"
                    "Input:\n"
                    f"{masked_text}\n\n"
                    "Output:"
                )

                response = client.chat.completions.create(
                    model=settings.GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user",   "content": user_prompt},
                    ],
                    temperature=0.3,
                    max_tokens=256,
                )

                generated_text = response.choices[0].message.content.strip()

                # Warn if any ENTITY tokens were dropped by the model
                missing_tokens = [k for k in entity_map.keys() if k not in generated_text]
                if missing_tokens:
                    logger.warning(
                        f"Groq dropped ENTITY tokens {missing_tokens} — "
                        "restore_entities will still inject them back."
                    )

                final_rephrased_text = restore_entities(generated_text, entity_map)

                # Safety: strip any remaining ENTITY_ tokens the LLM may have introduced
                if re.search(r'ENTITY[\s_\-]*\d+', final_rephrased_text, re.IGNORECASE):
                    logger.warning(
                        f"Residual ENTITY tokens detected after restore — cleaning up: "
                        f"{final_rephrased_text}"
                    )
                    final_rephrased_text = re.sub(
                        r'(?:ENTITY[\s_\-]*)+\d+', '', final_rephrased_text, flags=re.IGNORECASE
                    )
                    final_rephrased_text = re.sub(r'  +', ' ', final_rephrased_text).strip()

                rephrase_model_used = "groq"
                logger.info(f"Groq rephrased result: {final_rephrased_text}")

            except Exception as e:
                logger.warning(
                    f"Groq rephrasing failed ({type(e).__name__}: {e}). "
                    "Falling back to T5 model."
                )
                final_rephrased_text = None

        # ----------------------------------------------------------------
        # Step 3b: FALLBACK — local T5 model
        # ----------------------------------------------------------------
        if final_rephrased_text is None:
            if not self.model or not self.tokenizer:
                raise RuntimeError(
                    "Groq API key is not set and the T5 rephraser model is not loaded. "
                    "Add GROQ_API_KEY to your backend/.env file "
                    "(get a free key at https://console.groq.com) "
                    "or place the T5 model files at the configured ENTITY_REPHRASER_MODEL_PATH."
                )

            logger.info("Using T5 local model as fallback rephraser")
            self.model.to(self.device)
            self.model.eval()

            input_text = f"rephrase: {masked_text}"
            inputs = self.tokenizer(
                input_text,
                return_tensors="pt",
                max_length=512,
                truncation=True,
                padding=True,
            ).to(self.device)

            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_length=200,
                    num_beams=4,
                    early_stopping=True,
                    temperature=0.8,
                    do_sample=True,
                    top_p=0.92,
                )

            generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)

            # Rule-based cleanup for T5 fallback
            hedging_patterns = [
                (r'\bI think maybe\b', ''), (r'\bI think\b', ''),
                (r'\bmaybe\b', ''),          (r'\bperhaps\b', ''),
                (r'\bpossibly\b', ''),       (r'\bpotentially\b', ''),
                (r'\bkind of\b', ''),        (r'\bsort of\b', ''),
                (r'\bsomewhat\b', ''),       (r'\bprobably\b', ''),
                (r'\bmight\b', 'should'),    (r'\bcould\b', 'should'),
                (r'\bjust\b', ''),
            ]
            for pattern, replacement in hedging_patterns:
                generated_text = re.sub(
                    pattern, replacement, generated_text, flags=re.IGNORECASE
                )

            generated_text = re.sub(r'\s+', ' ', generated_text).strip()
            if generated_text and generated_text[0].islower():
                generated_text = generated_text[0].upper() + generated_text[1:]
            if generated_text and not generated_text.endswith(('.', '!', '?')):
                generated_text += '.'

            final_rephrased_text = restore_entities(generated_text, entity_map)

            # Safety cleanup for T5 fallback as well
            if re.search(r'ENTITY[\s_\-]*\d+', final_rephrased_text, re.IGNORECASE):
                logger.warning(f"Residual ENTITY tokens in T5 output — cleaning: {final_rephrased_text}")
                final_rephrased_text = re.sub(
                    r'(?:ENTITY[\s_\-]*)+\d+', '', final_rephrased_text, flags=re.IGNORECASE
                )
                final_rephrased_text = re.sub(r'  +', ' ', final_rephrased_text).strip()

            rephrase_model_used = "t5"
            logger.info(f"T5 fallback result: {final_rephrased_text}")

        # Step 4: Build response
        entities_detected = [
            {"text": ent.text, "label": ent.label_}
            for ent in doc.ents
        ]

        return EntityPreservingRephraseResult(
            original_text=text,
            rephrased_text=final_rephrased_text,
            entities_detected=entities_detected,
            entity_map=entity_map,
            masked_text=masked_text,
            rephrase_model=rephrase_model_used,
        )

    def _rephrase_with_gemini(self, masked_text: str) -> str:
        """Rephrase using Google Gemini API"""
        from google import genai

        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        prompt = (
            "You are an Agile writing assistant helping users refine brainstorming ideas.\n"
            "Rephrase the following idea to be clearer, more professional, and complete.\n\n"
            "Rules:\n"
            "- Do NOT change, remove, or paraphrase any ENTITY_N tokens (e.g. ENTITY_1, ENTITY_2). "
            "They must appear exactly as-is in your output.\n"
            "- Keep the same meaning and intent.\n"
            "- Output only the rephrased sentence. No explanation, no extra text.\n\n"
            f"Input: {masked_text}\n"
            "Output:"
        )

        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
        )
        return response.text.strip()

    def _rephrase_with_t5(self, masked_text: str) -> str:
        """Rephrase using the local T5 model (fallback)"""
        if not self.model or not self.tokenizer:
            raise RuntimeError(
                "Neither Gemini API key nor T5 rephraser model is available. "
                "Set GEMINI_API_KEY in .env or ensure the T5 model files are present."
            )

        self.model.to(self.device)
        self.model.eval()

        input_text = f"rephrase: {masked_text}"
        inputs = self.tokenizer(
            input_text,
            return_tensors="pt",
            max_length=512,
            truncation=True,
            padding=True
        ).to(self.device)

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_length=200,
                num_beams=4,
                early_stopping=True,
                temperature=0.8,
                do_sample=True,
                top_p=0.92
            )

        return self.tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    def rephrase_text(self, text: str, context: str = None) -> RephraseResult:
        """
        Rephrase text for improved clarity and inclusivity (legacy method).
        
        Args:
            text: Original text to rephrase
            context: Optional context for better rephrasing
            
        Returns:
            RephraseResult with original and rephrased text
        """
        if not self.model or not self.tokenizer:
            raise RuntimeError("Rephraser model not loaded")
        
        # Move model to device if needed
        self.model.to(self.device)
        
        # Prepare input with task prefix
        if context:
            input_text = f"rephrase with context {context}: {text}"
        else:
            input_text = f"rephrase: {text}"
        
        # Tokenize
        inputs = self.tokenizer(
            input_text,
            return_tensors="pt",
            max_length=512,
            truncation=True,
            padding=True
        ).to(self.device)
        
        # Generate
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_length=200,
                num_beams=4,
                early_stopping=True,
                temperature=0.7,
                do_sample=True,
                top_p=0.9
            )
        
        # Decode
        rephrased_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Identify improvements
        improvements = self._identify_improvements(text, rephrased_text)
        
        logger.info(f"Rephrased text successfully")
        
        return RephraseResult(
            original_text=text,
            rephrased_text=rephrased_text,
            improvements=improvements
        )
    
    def _identify_improvements(self, original: str, rephrased: str) -> List[str]:
        """Identify what improvements were made"""
        improvements = []
        
        # Check for hedging words removal
        hedging_words = ["maybe", "perhaps", "possibly", "potentially", "kind of", "sort of", "I think"]
        for word in hedging_words:
            if word.lower() in original.lower() and word.lower() not in rephrased.lower():
                improvements.append(f"Removed hedging word: '{word}'")
        
        # Check for passive to active voice
        if " be " in original.lower() and " be " not in rephrased.lower():
            improvements.append("Converted passive to active voice")
        
        # Check for clarity improvements
        if len(rephrased.split()) < len(original.split()):
            improvements.append("Simplified sentence structure")
        
        if not improvements:
            improvements.append("Enhanced clarity and directness")
        
        return improvements


# Global instance
text_rephraser = TextRephraser()
