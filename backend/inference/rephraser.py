"""
Text rephrasing using T5 model with entity preservation
"""
import logging
import torch
from typing import List, Dict, Tuple
import spacy

from core.schemas import RephraseResult, EntityPreservingRephraseResult
from inference.model_loader import model_manager

logger = logging.getLogger(__name__)


def mask_entities(text: str, doc: spacy.tokens.Doc) -> Tuple[str, Dict[str, str]]:
    """
    Masks recognized entities in a text with placeholder tokens (e.g., ENTITY_1).
    
    Args:
        text: The original text.
        doc: The spaCy Doc object containing recognized entities.
        
    Returns:
        Tuple containing the masked text and a dictionary mapping 
        placeholder keys (e.g., 'ENTITY_1') to original entity texts.
    """
    entity_map = {}
    masked_text = text
    
    # Sort entities by length (longest first) to avoid partial replacement issues
    sorted_ents = sorted(doc.ents, key=lambda e: len(e.text), reverse=True)
    
    for i, ent in enumerate(sorted_ents):
        key = f"ENTITY_{i+1}"
        entity_map[key] = ent.text
        masked_text = masked_text.replace(ent.text, key)
    
    return masked_text, entity_map


def restore_entities(text: str, entity_map: Dict[str, str]) -> str:
    """
    Restores original entities in a text from placeholder tokens using an entity map.
    
    Args:
        text: The text containing entity placeholders.
        entity_map: A dictionary mapping placeholder keys to original entity texts.
        
    Returns:
        The text with original entities restored.
    """
    # Sort by key length (longest first) to avoid partial replacements 
    # (e.g., replacing ENTITY_1 before ENTITY_10)
    for key in sorted(entity_map.keys(), key=len, reverse=True):
        value = entity_map[key]
        text = text.replace(key, value)
    return text


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
        Rephrase text while preserving named entities using masking technique.
        
        This method:
        1. Detects entities using spaCy NER
        2. Masks entities with placeholders (ENTITY_1, ENTITY_2, etc.)
        3. Rephrases the masked text using T5
        4. Restores original entities in the rephrased text
        
        Args:
            text: Original text to rephrase
            
        Returns:
            EntityPreservingRephraseResult with rephrased text and entity info
        """
        import re  # Import here to avoid issues
        
        if not self.model or not self.tokenizer:
            raise RuntimeError("Rephraser model not loaded")
        if not self.ner_model:
            raise RuntimeError("NER model not loaded")
        
        # Move model to device
        self.model.to(self.device)
        self.model.eval()
        
        # Step 1: Detect entities using spaCy
        doc = self.ner_model(text)
        
        # Step 2: Mask entities
        masked_text, entity_map = mask_entities(text, doc)
        
        logger.info(f"Masked {len(entity_map)} entities: {list(entity_map.keys())}")
        logger.info(f"Masked text: {masked_text}")
        
        # Step 3: Try T5-based rephrasing first
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
        
        generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        logger.info(f"T5 generated text: {generated_text}")
        
        # Step 4: Apply rule-based improvements if T5 didn't change much
        # Remove hedging words and phrases for more confident communication
        improved_text = generated_text
        
        hedging_patterns = [
            (r'\bI think maybe\b', ''),
            (r'\bI think\b', ''),
            (r'\bmaybe\b', ''),
            (r'\bperhaps\b', ''),
            (r'\bpossibly\b', ''),
            (r'\bpotentially\b', ''),
            (r'\bkind of\b', ''),
            (r'\bsort of\b', ''),
            (r'\bsomewhat\b', ''),
            (r'\bprobably\b', ''),
            (r'\bmight\b', 'should'),
            (r'\bcould\b', 'should'),
            (r'\bjust\b', ''),
        ]
        
        for pattern, replacement in hedging_patterns:
            improved_text = re.sub(pattern, replacement, improved_text, flags=re.IGNORECASE)
        
        # Clean up extra spaces
        improved_text = re.sub(r'\s+', ' ', improved_text).strip()
        
        # Capitalize first letter if needed
        if improved_text and improved_text[0].islower():
            improved_text = improved_text[0].upper() + improved_text[1:]
        
        # Ensure sentence ends with period
        if improved_text and not improved_text.endswith(('.', '!', '?')):
            improved_text += '.'
        
        logger.info(f"After rule-based improvements: {improved_text}")
        
        # Step 5: Restore entities
        for key, value in sorted(entity_map.items(), key=lambda x: len(x[0]), reverse=True):
            if key in improved_text:
                improved_text = improved_text.replace(key, value)
            else:
                pattern = re.compile(re.escape(key), re.IGNORECASE)
                improved_text = pattern.sub(value, improved_text)
        
        final_rephrased_text = improved_text
        
        logger.info(f"Final rephrased text: {final_rephrased_text}")
        
        # Extract entity info for response
        entities_detected = [
            {"text": ent.text, "label": ent.label_}
            for ent in doc.ents
        ]
        
        return EntityPreservingRephraseResult(
            original_text=text,
            rephrased_text=final_rephrased_text,
            entities_detected=entities_detected,
            entity_map=entity_map,
            masked_text=masked_text
        )
    
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
