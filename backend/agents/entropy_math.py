# backend/agents/entropy_math.py
import math
from collections import Counter
import binascii

class EntropyCalculationAgent:
    def __init__(self):
        pass

    def calculate_entropy(self, key_data: str, is_hex: bool = False) -> dict:
        """
        Calculates the Shannon Entropy of the given key data.
        """
        try:
            # Convert hex to raw bytes if necessary
            if is_hex:
                data = binascii.unhexlify(key_data)
            else:
                data = key_data.encode('utf-8')

            if not data:
                return {"entropy_score": 0.0, "status": "Weak (Empty)"}

            # Calculate frequency of each byte
            data_length = len(data)
            frequencies = Counter(data)

            # Shannon Entropy formula: H(x) = - sum( p(x) * log2(p(x)) )
            entropy = 0.0
            for count in frequencies.values():
                probability = count / data_length
                entropy -= probability * math.log2(probability)

            # Determine strength based on the score (Max is 8.0 for byte data)
            if entropy > 7.5:
                strength = "Strong"
            elif entropy > 6.0:
                strength = "Moderate"
            else:
                strength = "Weak"

            return {
                "entropy_score": round(entropy, 4),
                "max_possible": 8.0,
                "strength": strength
            }

        except Exception as e:
            raise ValueError(f"Failed to calculate entropy: {str(e)}")