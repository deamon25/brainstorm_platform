"""
Hesitation detection using Isolation Forest model on typing behavior
"""
import logging
import numpy as np
import pandas as pd
from typing import Dict

from core.schemas import HesitationResult
from inference.model_loader import model_manager

logger = logging.getLogger(__name__)


class HesitationDetector:
    """
    Detect hesitation patterns from typing session behavior using Isolation Forest.
    
    The model uses 5 features:
    - delFreq: Total number of deletions (backspaces)
    - leftFreq: Total number of left arrow key presses
    - TotTime: Total time taken for typing session (ms)
    - backspace_ratio: Calculated as delFreq / (TotTime/1000 + 1)
    - correction_rate: Calculated as (delFreq + leftFreq) / (TotTime/1000 + 1)
    """
    
    def __init__(self):
        # Feature names in the exact order the model was trained on
        self.feature_names = ['delFreq', 'leftFreq', 'TotTime', 'backspace_ratio', 'correction_rate']
    
    @property
    def model(self):
        """Get the hesitation model lazily from model_manager"""
        return model_manager.hesitation_model
    
    @property
    def scaler(self):
        """Get the scaler lazily from model_manager"""
        return model_manager.scaler
    
    def calculate_derived_features(self, delFreq: float, leftFreq: float, TotTime: float) -> tuple:
        """
        Calculate derived features from raw typing metrics.
        
        Args:
            delFreq: Number of deletions/backspaces
            leftFreq: Number of left arrow key presses
            TotTime: Total time in milliseconds
            
        Returns:
            Tuple of (backspace_ratio, correction_rate)
        """
        # Convert time to seconds and add 1 to prevent division by zero
        time_seconds = TotTime / 1000.0
        denominator = time_seconds + 1.0
        
        backspace_ratio = delFreq / denominator
        correction_rate = (delFreq + leftFreq) / denominator
        
        return backspace_ratio, correction_rate
    
    def prepare_features(self, delFreq: float, leftFreq: float, TotTime: float) -> pd.DataFrame:
        """
        Prepare feature vector for model input.
        
        Args:
            delFreq: Number of deletions
            leftFreq: Number of left arrow presses
            TotTime: Total time in milliseconds
            
        Returns:
            DataFrame with features in correct order
        """
        # Calculate derived features
        backspace_ratio, correction_rate = self.calculate_derived_features(delFreq, leftFreq, TotTime)
        
        # Create feature vector in exact order
        features_data = [[delFreq, leftFreq, TotTime, backspace_ratio, correction_rate]]
        
        # Create DataFrame with proper column names
        X = pd.DataFrame(features_data, columns=self.feature_names)
        
        logger.info(f"Prepared features: delFreq={delFreq}, leftFreq={leftFreq}, TotTime={TotTime}, "
                   f"backspace_ratio={backspace_ratio:.4f}, correction_rate={correction_rate:.4f}")
        
        return X
    
    def detect_hesitation(self, delFreq: float, leftFreq: float, TotTime: float) -> HesitationResult:
        """
        Detect hesitation from typing session data using Isolation Forest.
        
        Args:
            delFreq: Number of deletions/backspaces
            leftFreq: Number of left arrow key presses
            TotTime: Total typing time in milliseconds
            
        Returns:
            HesitationResult with anomaly score and prediction
            
        Raises:
            RuntimeError: If model or scaler not loaded
        """
        if not self.model or not self.scaler:
            raise RuntimeError("Hesitation model or scaler not loaded")
        
        # Prepare features
        X = self.prepare_features(delFreq, leftFreq, TotTime)
        
        # Scale features using the pre-trained scaler
        X_scaled = self.scaler.transform(X)
        
        # Get anomaly score from Isolation Forest
        # Lower (more negative) scores = higher hesitation/anomaly
        # Higher (more positive) scores = less hesitation/normal
        hesitation_score = float(self.model.decision_function(X_scaled)[0])
        
        # Get binary prediction
        # -1 = anomaly (hesitant), 1 = normal (not hesitant)
        prediction = self.model.predict(X_scaled)[0]
        
        # Convert to boolean: -1 -> True (hesitant), 1 -> False (not hesitant)
        is_hesitant = (prediction == -1)
        
        # Store input features for transparency
        backspace_ratio, correction_rate = self.calculate_derived_features(delFreq, leftFreq, TotTime)
        input_features = {
            "delFreq": float(delFreq),
            "leftFreq": float(leftFreq),
            "TotTime": float(TotTime),
            "backspace_ratio": float(backspace_ratio),
            "correction_rate": float(correction_rate)
        }
        
        logger.info(f"Hesitation detection: score={hesitation_score:.4f}, "
                   f"is_hesitant={is_hesitant}, prediction={prediction}")
        
        return HesitationResult(
            hesitation_score=hesitation_score,
            is_hesitant=is_hesitant,
            input_features=input_features
        )


# Global instance
hesitation_detector = HesitationDetector()
