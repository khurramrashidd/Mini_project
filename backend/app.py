# backend/app.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import base64
import re

# Import all 5 Core Agents
from agents.key_generator import KeyGeneratorAgent
from agents.math_model_agent import MathModelAgent 
from agents.ai_entropy_agent import AIEntropyAgent
from agents.crypto_strength_agent import CryptoStrengthAgent
from agents.performance_agent import PerformanceAgent

app = FastAPI(title="CryptoKMS Engine", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate Agents
key_gen_agent = KeyGeneratorAgent()
math_model_agent = MathModelAgent() 
ai_agent = AIEntropyAgent()
strength_agent = CryptoStrengthAgent()
perf_agent = PerformanceAgent()

class KeyRequest(BaseModel):
    purpose: str = Field(..., description="E.g., SBI Net Banking")
    algorithm: str = Field(..., description="AES, RSA, or ECC")
    length: int = Field(256, description="Key length in bits")
@app.get("/")
def health_check():
    return {
        "status": "Online",
        "message": "CryptoKMS Engine API is running perfectly.",
        "version": "2.0"
    }
@app.post("/api/generate-key")
def generate_cryptographic_key(request: KeyRequest):
    try:
        perf_agent.start_timer()
        # Bumping to 10 attempts to give asymmetric keys more chances
        max_retries = 10 
        attempt = 0
        is_secure = False
        
        generated_data = {}
        math_analysis = {}
        ai_analysis = {}
        strength_analysis = strength_agent.evaluate_strength(request.algorithm, request.length)

        while not is_secure and attempt < max_retries:
            attempt += 1
            
            # Agent 1: Generate
            generated_data = key_gen_agent.generate_key(request.algorithm, request.length)
            
            # Normalize target data
            if request.algorithm == "AES":
                target_data = generated_data["key_hex"]
            else:
                # Strip PEM and decode Base64 for RSA/ECC
                pem_string = generated_data["private_key"]
                b64_payload = re.sub(r'-----.*?-----|\s', '', pem_string)
                target_data = base64.b64decode(b64_payload).hex()
                
            # Agent 3 & 2: Validate
            math_analysis = math_model_agent.analyze_key(target_data)
            ai_analysis = ai_agent.analyze_patterns(target_data)
            
            math_pass = math_analysis["overall_math_grade"] == "Strong"
            ai_pass = ai_analysis["recommendation"] == "Pass"
            strength_pass = strength_analysis["verdict"] == "Pass"
            
            # --- ALGORITHM-AWARE LOGIC ---
            if request.algorithm == "AES":
                # Symmetric keys must be perfectly pattern-free
                if math_pass and ai_pass and strength_pass:
                    is_secure = True
            else:
                # Asymmetric (RSA/ECC) have inherent mathematical prime structures.
                # We require perfect strength, but allow passing if EITHER Math or AI is happy.
                if strength_pass and (math_pass or ai_pass):
                    is_secure = True
                
        perf_analysis = perf_agent.stop_timer(retries=attempt)
        
        if not is_secure:
            raise ValueError(f"Pipeline failed to generate a secure {request.algorithm} key after {max_retries} attempts.")

        return {
            "status": "success",
            "pipeline_result": "Approved & Certified",
            "metadata": {
                "purpose": request.purpose,
                "algorithm": request.algorithm,
                "bits": request.length
            },
            "key_data": generated_data,
            "pipeline_agents": {
                "Agent_3_Math": math_analysis,
                "Agent_2_AI": ai_analysis,
                "Agent_4_Strength": strength_analysis,
                "Agent_5_Performance": perf_analysis
            }
        }

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
