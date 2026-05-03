# backend/agents/crypto_strength_agent.py
import math

class CryptoStrengthAgent:
    def __init__(self):
        self.name = "CryptoStrengthAgent"

    def evaluate_strength(self, algorithm: str, length: int) -> dict:
        """Evaluates theoretical brute-force resistance and security level."""
        
        # Calculate theoretical bits of security
        security_bits = 0
        if algorithm == "AES":
            security_bits = length
        elif algorithm == "RSA":
            # NIST mapping for RSA security equivalents
            if length < 2048: security_bits = 80
            elif length == 2048: security_bits = 112
            elif length == 3072: security_bits = 128
            else: security_bits = 192
        elif algorithm == "ECC":
            # ECC security is roughly half the key size
            security_bits = length // 2

        # Calculate time to crack using a theoretical supercomputer (1 trillion guesses/sec)
        # 2^security_bits / 10^12 seconds
        if security_bits <= 80:
            time_to_crack = "Vulnerable (Hours/Days)"
            score = "Fail"
        elif security_bits <= 112:
            time_to_crack = "Moderate (Decades)"
            score = "Pass"
        else:
            time_to_crack = "Impenetrable (Millions of years)"
            score = "Pass"

        return {
            "agent": self.name,
            "security_bits": security_bits,
            "brute_force_resistance": time_to_crack,
            "verdict": score
        }