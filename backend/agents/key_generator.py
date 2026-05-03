# backend/agents/key_generator.py
from Crypto.PublicKey import RSA, ECC
from Crypto.Random import get_random_bytes
import binascii

# backend/agents/key_generator.py
import secrets
from Crypto.PublicKey import RSA, ECC

class KeyGeneratorAgent:
    def __init__(self):
        self.name = "KeyGeneratorAgent"

    def generate_key(self, algorithm: str, length: int = 256):
        if algorithm == "AES":
            # FIX: Use 'secrets' for maximum OS-level cryptographic entropy
            byte_length = length // 8
            secure_hex = secrets.token_hex(byte_length)
            
            return {
                "algorithm": "AES",
                "length": length,
                "key_hex": secure_hex
            }
            
        elif algorithm == "RSA":
            # Ensure you are using pycryptodome for this
            key = RSA.generate(length)
            return {
                "algorithm": "RSA",
                "private_key": key.export_key().decode(),
                "public_key": key.publickey().export_key().decode()
            }
            
        elif algorithm == "ECC":
            key = ECC.generate(curve='P-256')
            return {
                "algorithm": "ECC",
                "private_key": key.export_key(format='PEM'),
                "public_key": key.public_key().export_key(format='PEM')
            }
        else:
            raise ValueError(f"Algorithm {algorithm} is not supported.")

    def generate_key(self, algorithm: str, length: int) -> dict:
        algorithm = algorithm.upper()
        
        if algorithm == "AES":
            return self._generate_aes(length)
        elif algorithm == "RSA":
            return self._generate_rsa(length)
        elif algorithm == "ECC":
            # ECC length generally dictates the curve, but we'll default to standard P-256 for simplicity in this demo
            return self._generate_ecc()
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")

    def _generate_aes(self, length: int) -> dict:
        # Length comes in bits (e.g., 128, 256), get_random_bytes needs bytes
        byte_length = length // 8
        key = get_random_bytes(byte_length)
        return {
            "algorithm": "AES",
            "length": length,
            "key_hex": binascii.hexlify(key).decode('utf-8')
        }

    def _generate_rsa(self, length: int) -> dict:
        if length not in [1024, 2048, 4096]:
            length = 2048 # Default to secure length

        key = RSA.generate(length)
        private_key = key.export_key().decode('utf-8')
        public_key = key.publickey().export_key().decode('utf-8')
        
        return {
            "algorithm": "RSA",
            "length": length,
            "private_key": private_key,
            "public_key": public_key
        }

    def _generate_ecc(self) -> dict:
        # Using the standard NIST P-256 curve
        key = ECC.generate(curve='P-256')
        private_key = key.export_key(format='PEM')
        public_key = key.public_key().export_key(format='PEM')
        
        return {
            "algorithm": "ECC",
            "curve": "P-256",
            "private_key": private_key,
            "public_key": public_key
        }