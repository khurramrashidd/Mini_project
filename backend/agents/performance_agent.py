# backend/agents/performance_agent.py
import time

class PerformanceAgent:
    def __init__(self):
        self.name = "PerformanceAgent"
        self.start_time = 0

    def start_timer(self):
        self.start_time = time.perf_counter()

    def stop_timer(self, retries: int) -> dict:
        execution_time = (time.perf_counter() - self.start_time) * 1000 # Convert to milliseconds
        
        return {
            "agent": self.name,
            "execution_time_ms": round(execution_time, 2),
            "generation_loops": retries,
            "rating": "Optimal" if execution_time < 2000 else "Slow"
        }