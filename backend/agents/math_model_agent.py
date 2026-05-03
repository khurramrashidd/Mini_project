# backend/agents/math_model_agent.py
import math
import scipy.special as sp

class MathModelAgent:
    def __init__(self):
        self.name = "MathModelAgent"

    def calculate_shannon_entropy(self, byte_data: bytes) -> float:
        """Calculates the Shannon Entropy based on byte frequency."""
        if not byte_data:
            return 0.0
            
        entropy = 0
        for x in range(256):
            p_x = float(byte_data.count(x)) / len(byte_data)
            if p_x > 0:
                entropy += - p_x * math.log(p_x, 2)
        return round(entropy, 4)

    def monobit_frequency_test(self, data: str) -> dict:
        """NIST SP 800-22 Monobit Test to check 0/1 balance."""
        try:
            bit_string = bin(int(data, 16))[2:].zfill(len(data) * 4)
        except ValueError:
            bit_string = ''.join(format(ord(c), '08b') for c in data)

        n = len(bit_string)
        if n == 0:
            return {"p_value": 0.0, "is_random": False, "score": "Fail"}
            
        sum_val = sum([1 if bit == '1' else -1 for bit in bit_string])
        s_obs = abs(sum_val) / math.sqrt(n)
        p_value = sp.erfc(s_obs / math.sqrt(2))
        is_random = p_value >= 0.01
        
        return {
            "p_value": float(round(p_value, 6)),
            "is_random": bool(is_random),
            "score": "Pass" if is_random else "Fail"
        }

    def analyze_key(self, data: str):
        # 1. Convert to bytes
        try:
            byte_data = bytes.fromhex(data)
        except ValueError:
            byte_data = data.encode('utf-8')
            
        data_length = len(byte_data)
        
        # 2. Calculate actual entropy
        entropy = self.calculate_shannon_entropy(byte_data)
        
        # 3. Calculate DYNAMIC maximum possible entropy for this specific key length
        # Max entropy is log2(N), capped at 8.0 for byte-level analysis
        max_possible_entropy = min(8.0, math.log(data_length, 2)) if data_length > 0 else 0
        
        # 4. Check NIST
        frequency = self.monobit_frequency_test(data)
        
        # 5. Grade it! (Strong if it reaches at least 90% of its theoretical max)
        is_strong_entropy = entropy >= (max_possible_entropy * 0.90)
        
        return {
            "agent": self.name,
            "shannon_entropy": entropy,
            "max_theoretical_entropy": round(max_possible_entropy, 4), # Showing the math!
            "entropy_health": f"{round((entropy/max_possible_entropy)*100, 2)}%" if max_possible_entropy else "0%",
            "nist_monobit": frequency,
            "overall_math_grade": "Strong" if (is_strong_entropy and frequency['is_random']) else "Weak"
        }