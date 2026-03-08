"""
Entity extraction using spaCy NER model
"""
import logging
from typing import List

from core.schemas import EntityResult
from inference.model_loader import model_manager

logger = logging.getLogger(__name__)


class EntityExtractor:
    """Extract named entities from text"""
    
    @property
    def model(self):
        """Get the NER model lazily from model_manager"""
        return model_manager.ner_model
    
    def extract_entities(self, text: str) -> List[EntityResult]:
        """
        Extract named entities from text using spaCy NER
        
        Args:
            text: Input text to analyze
            
        Returns:
            List of EntityResult objects
        """
        if not self.model:
            raise RuntimeError("NER model not loaded")
        
        doc = self.model(text)
        
        entities = []
        for ent in doc.ents:
            entities.append(EntityResult(
                text=ent.text,
                label=ent.label_,
                start=ent.start_char,
                end=ent.end_char
            ))
        
        logger.info(f"Extracted {len(entities)} entities from text")
        return entities
    
    def get_entity_summary(self, entities: List[EntityResult]) -> dict:
        """Get summary statistics of extracted entities"""
        entity_counts = {}
        for entity in entities:
            entity_counts[entity.label] = entity_counts.get(entity.label, 0) + 1
        
        return {
            "total_entities": len(entities),
            "entity_types": entity_counts,
            "unique_types": len(entity_counts)
        }


# Global instance
entity_extractor = EntityExtractor()
