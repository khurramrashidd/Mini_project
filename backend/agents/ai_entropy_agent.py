# backend/agents/ai_entropy_agent.py
import numpy as np

class AIEntropyAgent:
    def __init__(self):
        self.name = "AIEntropyAgent"

    def extract_features(self, data: str):
        """Converts hex or text data to binary array and extracts ML features."""
        try:
            # Try parsing as Hexadecimal (for AES keys)
            bit_string = bin(int(data, 16))[2:].zfill(len(data) * 4)
        except ValueError:
            # Fallback for plain text / PEM strings (for RSA and ECC keys)
            bit_string = ''.join(format(ord(c), '08b') for c in data)
            
        if not bit_string:
            return 0.5 # Default middle-ground if string is empty
            
        bits = np.array([int(b) for b in bit_string])
        
        # Feature Extraction: Calculate bit transitions (0 to 1, or 1 to 0)
        transitions = np.sum(bits[:-1] != bits[1:])
        transition_ratio = transitions / len(bits)
        
        return transition_ratio

    def analyze_patterns(self, data: str):
        """Evaluates the key using AI feature thresholds."""
        if not data:
            raise ValueError("No data provided to AI Model")
            
        transition_ratio = self.extract_features(data)
        
        # ML Logic Simulation: A perfectly random string has a transition ratio of ~0.5
        ai_confidence = 1.0 - abs(0.5 - transition_ratio) * 2
        
        # Determine if the key passes the AI pattern detection
        is_pattern_free = ai_confidence > 0.85
        
        return {
            "agent": self.name,
            "ai_confidence_score": round(ai_confidence * 100, 2),
            "transition_ratio": round(transition_ratio, 4),
            "ai_prediction": "Secure" if is_pattern_free else "Hidden Pattern Detected",
            "recommendation": "Pass" if is_pattern_free else "Reject"
        }