"""
Model loading and management
"""
import logging
import joblib
from pathlib import Path
from typing import Optional

import spacy
import torch
from transformers import T5ForConditionalGeneration, T5Tokenizer

from core.config import settings

logger = logging.getLogger(__name__)


class ModelManager:
    """Manages loading and caching of all models"""
    
    def __init__(self):
        self.ner_model: Optional[spacy.language.Language] = None
        self.rephraser_model: Optional[T5ForConditionalGeneration] = None
        self.rephraser_tokenizer: Optional[T5Tokenizer] = None
        self.hesitation_model = None
        self.scaler = None
        self.speech_hesitation_model = None
        
    def load_all_models(self):
        """Load all models at startup"""
        logger.info("Loading all models...")
        
        try:
            # Load spaCy NER model
            self.load_ner_model()
            
            # Load T5 Rephraser model
            self.load_rephraser_model()
            
            # Try to load Hesitation model (optional)
            try:
                self.load_hesitation_model()
            except Exception as e:
                logger.warning(f"Hesitation model failed to load (will continue without it): {e}")
                logger.warning("Hesitation detection endpoint will not be available")

            # Try to load Speech Hesitation model (optional)
            try:
                self.load_speech_hesitation_model()
            except Exception as e:
                logger.warning(f"Speech hesitation model failed to load (will continue without it): {e}")
                logger.warning("Speech hesitation detection endpoint will not be available")

            logger.info("Model loading completed!")
            
        except Exception as e:
            logger.error(f"Error loading critical models: {e}")
            raise
    
    def load_ner_model(self):
        """Load spaCy NER model"""
        try:
            logger.info(f"Loading NER model from {settings.ENTITY_NER_MODEL_PATH}")
            self.ner_model = spacy.load(str(settings.ENTITY_NER_MODEL_PATH))
            logger.info("NER model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load NER model: {e}")
            raise
    
    def load_rephraser_model(self):
        """Load T5 rephraser model"""
        try:
            logger.info(f"Loading rephraser model from {settings.ENTITY_REPHRASER_MODEL_PATH}")
            self.rephraser_tokenizer = T5Tokenizer.from_pretrained(
                str(settings.ENTITY_REPHRASER_MODEL_PATH),
                local_files_only=True
            )
            self.rephraser_model = T5ForConditionalGeneration.from_pretrained(
                str(settings.ENTITY_REPHRASER_MODEL_PATH),
                local_files_only=True
            )
            logger.info("Rephraser model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load rephraser model: {e}")
            raise
    
    def load_hesitation_model(self):
        """Load hesitation detection model (scikit-learn)"""
        try:
            logger.info(f"Loading hesitation model from {settings.HESITATION_MODEL_PATH}")
            
            # Use joblib for sklearn models
            self.hesitation_model = joblib.load(settings.HESITATION_MODEL_PATH)
            self.scaler = joblib.load(settings.SCALER_PATH)
            
            logger.info("Hesitation model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load hesitation model: {e}")
            raise
    
    def load_speech_hesitation_model(self):
        """Load PyTorch speech hesitation model (CNN + BiLSTM + Attention)"""
        try:
            from inference.speech_hesitation_detector import SpeechHesitationModel
            logger.info(f"Loading speech hesitation model from {settings.SPEECH_HESITATION_MODEL_PATH}")
            model = SpeechHesitationModel(input_size=92)
            model.load_state_dict(
                torch.load(str(settings.SPEECH_HESITATION_MODEL_PATH), map_location="cpu")
            )
            model.eval()
            self.speech_hesitation_model = model
            logger.info("Speech hesitation model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load speech hesitation model: {e}")
            raise

    def get_models_status(self) -> dict:
        """Check which models are loaded"""
        return {
            "ner_model": self.ner_model is not None,
            "rephraser_model": self.rephraser_model is not None,
            "hesitation_model": self.hesitation_model is not None,
            "speech_hesitation_model": self.speech_hesitation_model is not None,
        }


# Global model manager instance
model_manager = ModelManager()
