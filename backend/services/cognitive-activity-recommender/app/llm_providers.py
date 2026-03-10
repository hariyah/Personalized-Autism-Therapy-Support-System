from abc import ABC, abstractmethod
from typing import List, Dict, Any
import logging
import httpx
from openai import AsyncOpenAI
from app.config import settings
from app.plan_prompt_builder import build_therapist_plan_prompt

logger = logging.getLogger(__name__)


class LLMProvider(ABC):
    @abstractmethod
    async def generate_activity_plan(
        self,
        child_profile: Dict[str, Any],
        activities: List[Dict[str, Any]],
        plan_request: Dict[str, Any],
        recent_outcomes: List[Dict[str, Any]],
    ) -> str:
        pass
    
    async def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        """Generate text from system and user prompts (for two-stage planning)."""
        # Default implementation uses OpenAI/Ollama chat API
        raise NotImplementedError("Subclass must implement generate_text")


class OpenAIProvider(LLMProvider):
    def __init__(self):
        self._client = None
    
    @property
    def client(self):
        if self._client is None:
            if not settings.openai_api_key:
                raise ValueError("OPENAI_API_KEY not set in environment")
            self._client = AsyncOpenAI(api_key=settings.openai_api_key)
        return self._client

    async def generate_activity_plan(
        self,
        child_profile: Dict[str, Any],
        activities: List[Dict[str, Any]],
        plan_request: Dict[str, Any],
        recent_outcomes: List[Dict[str, Any]],
    ) -> str:
        # Use centralized prompt builder
        system_prompt, user_prompt = build_therapist_plan_prompt(
            child_profile=child_profile,
            activities=activities,
            plan_request=plan_request,
            recent_outcomes=recent_outcomes,
            format_activities_fn=self._format_activities,
            format_outcomes_fn=self._format_outcomes,
        )

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=4000,  # Increased for longer structured plans
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI API error: {type(e).__name__}: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            raise Exception(f"OpenAI API error: {str(e)}")
    
    async def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        """Generate text from system and user prompts."""
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=4000,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI API error: {type(e).__name__}: {str(e)}")
            raise Exception(f"OpenAI API error: {str(e)}")

    def _format_activities(self, activities: List[Dict[str, Any]]) -> str:
        """Format activities list for LLM prompt with IDs for strict selection."""
        formatted = []
        for idx, act in enumerate(activities, 1):
            act_id = str(act.get('id', act.get('_id', '')))
            act_name = act.get('activity_name', act.get('name', 'Unknown'))
            source_type = act.get('source_type', 'synthetic')
            materials = act.get('materials', [])
            if isinstance(materials, str):
                materials = [m.strip() for m in materials.split(',') if m.strip()]
            
            # Format step instructions
            step_instructions = act.get('step_instructions', [])
            if isinstance(step_instructions, str):
                step_instructions = [s.strip() for s in step_instructions.split('.') if s.strip()]
            elif not isinstance(step_instructions, list):
                step_instructions = []
            
            steps_text = ""
            if step_instructions:
                steps_text = "\n   Steps: " + " | ".join(step_instructions[:5])  # Show first 5 steps
            
            formatted.append(
                f"{idx}. ID: {act_id} | Name: {act_name}\n"
                f"   Domain: {act.get('domain', act.get('category', ''))}\n"
                f"   Source Type: {source_type}\n"
                f"   Goal: {act.get('goal', '')}\n"
                f"   Skills: {', '.join(act.get('skills_targeted', act.get('skill_targets', [])))}\n"
                f"   Difficulty: {act.get('difficulty', '')}\n"
                f"   Age Range: {act.get('age_range', '')}\n"
                f"   Sensory Suitability: {act.get('sensory_suitability', '')}\n"
                f"   Duration: {act.get('time_required_minutes', act.get('duration_minutes', 15))} minutes\n"
                f"   Materials: {', '.join(materials) if materials else 'None specified'}{steps_text}"
            )
        return "\n".join(formatted)

    def _format_outcomes(self, outcomes: List[Dict[str, Any]]) -> str:
        if not outcomes:
            return "No recent outcomes available."
        formatted = []
        for outcome in outcomes:
            formatted.append(
                f"- Activity: {outcome.get('activity_name', 'Unknown')}\n"
                f"  Engagement: {outcome.get('engagement')}/5, "
                f"Stress: {outcome.get('stress')}/5, "
                f"Success: {outcome.get('success')}/5\n"
                f"  Notes: {outcome.get('notes', 'None')}"
            )
        return "\n".join(formatted)


class OllamaProvider(LLMProvider):
    def __init__(self):
        self.endpoint = settings.ollama_endpoint
        self.model = settings.ollama_model
        # Check if CPU mode is requested via environment variable or config
        import os
        self.use_cpu = os.getenv("OLLAMA_NUM_GPU", "1") == "0" or getattr(settings, "ollama_use_cpu", False)

    async def generate_activity_plan(
        self,
        child_profile: Dict[str, Any],
        activities: List[Dict[str, Any]],
        plan_request: Dict[str, Any],
        recent_outcomes: List[Dict[str, Any]],
    ) -> str:
        # Use centralized prompt builder
        system_prompt, user_prompt = build_therapist_plan_prompt(
            child_profile=child_profile,
            activities=activities,
            plan_request=plan_request,
            recent_outcomes=recent_outcomes,
            format_activities_fn=self._format_activities,
            format_outcomes_fn=self._format_outcomes,
        )

        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                response = await client.post(
                    self.endpoint,
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "stream": False,
                        "options": {
                            "temperature": 0.7,
                            "num_predict": 4000,  # Increased for longer structured plans
                        }
                    },
                )
                response.raise_for_status()
                result = response.json()
                
                # Ollama chat API returns message content
                message = result.get("message", {})
                content = message.get("content", "")
                
                if not content:
                    logger.warning("Empty response from Ollama")
                    raise Exception("Empty response from Ollama")
                
                return content
            except httpx.ConnectError as e:
                logger.error(f"Ollama connection error: {str(e)}")
                error_msg = (
                    f"Ollama is not running or not accessible at {self.endpoint}. "
                    "Please ensure:\n"
                    "1. Ollama is installed from https://ollama.ai\n"
                    "2. Ollama service is running (check with 'ollama list')\n"
                    "3. The model is pulled: 'ollama pull llama3.1'\n"
                    "4. Ollama is accessible at http://localhost:11434"
                )
                raise Exception(error_msg) from e
            except httpx.HTTPStatusError as e:
                error_text = e.response.text
                logger.error(f"Ollama HTTP error: {e.response.status_code} - {error_text}")
                
                # Parse error message if it's JSON
                try:
                    error_json = e.response.json()
                    error_msg = error_json.get("error", error_text)
                except:
                    error_msg = error_text
                
                # Check for CUDA/GPU errors (including memory errors)
                is_memory_error = "out of memory" in error_msg.lower() or "cudamalloc" in error_msg.lower()
                is_cuda_error = "cuda" in error_msg.lower() and ("error" in error_msg.lower() or "terminated" in error_msg.lower())
                
                if is_memory_error or is_cuda_error:
                    cpu_instructions = ""
                    if not self.use_cpu:
                        cpu_instructions = (
                            "\n\n🔧 QUICK FIX - Restart Ollama in CPU mode:\n"
                            "1. Stop Ollama completely (close window or Ctrl+C)\n"
                            "2. Open a NEW terminal\n"
                            "3. Run: set OLLAMA_NUM_GPU=0 && ollama serve (CMD)\n"
                            "   Or: $env:OLLAMA_NUM_GPU='0'; ollama serve (PowerShell)\n"
                            "   Or: Double-click backend\\start_ollama_cpu.bat\n"
                            "4. Keep that window open, then restart FastAPI\n"
                        )
                    
                    error_type = "GPU memory" if is_memory_error else "CUDA/GPU"
                    raise Exception(
                        f"Ollama {error_type} error: {error_msg}\n\n"
                        "Solutions:\n"
                        "1. Use CPU mode (recommended): Restart Ollama with OLLAMA_NUM_GPU=0\n"
                        "2. Use a smaller model: 'ollama pull llama3.1:8b'\n"
                        "3. Close other GPU-intensive applications\n"
                        "4. Check your GPU drivers are up to date"
                        + cpu_instructions
                    )
                else:
                    raise Exception(f"Ollama API HTTP error {e.response.status_code}: {error_msg}")
            except Exception as e:
                logger.error(f"Ollama API error: {type(e).__name__}: {str(e)}")
                import traceback
                logger.error(traceback.format_exc())
                raise Exception(f"Ollama API error: {str(e)}")
    
    async def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        """Generate text from system and user prompts."""
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                response = await client.post(
                    self.endpoint,
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "stream": False,
                        "options": {
                            "temperature": 0.7,
                            "num_predict": 4000,
                        }
                    },
                )
                response.raise_for_status()
                result = response.json()
                
                message = result.get("message", {})
                content = message.get("content", "")
                
                if not content:
                    logger.warning("Empty response from Ollama")
                    raise Exception("Empty response from Ollama")
                
                return content
            except Exception as e:
                logger.error(f"Ollama API error: {type(e).__name__}: {str(e)}")
                raise Exception(f"Ollama API error: {str(e)}")
    
    def _format_activities(self, activities: List[Dict[str, Any]]) -> str:
        """Format activities list for LLM prompt with IDs for strict selection."""
        formatted = []
        for idx, act in enumerate(activities, 1):
            act_id = str(act.get('id', act.get('_id', '')))
            act_name = act.get('activity_name', act.get('name', 'Unknown'))
            source_type = act.get('source_type', 'synthetic')
            materials = act.get('materials', [])
            if isinstance(materials, str):
                materials = [m.strip() for m in materials.split(',') if m.strip()]
            formatted.append(
                f"{idx}. ID: {act_id} | Name: {act_name}\n"
                f"   Domain: {act.get('domain', act.get('category', ''))}\n"
                f"   Source Type: {source_type}\n"
                f"   Goal: {act.get('goal', '')}\n"
                f"   Skills: {', '.join(act.get('skills_targeted', act.get('skill_targets', [])))}\n"
                f"   Difficulty: {act.get('difficulty', '')}\n"
                f"   Age Range: {act.get('age_range', '')}\n"
                f"   Sensory Suitability: {act.get('sensory_suitability', '')}\n"
                f"   Duration: {act.get('time_required_minutes', act.get('duration_minutes', 15))} minutes\n"
                f"   Materials: {', '.join(materials) if materials else 'None specified'}"
            )
        return "\n".join(formatted)

    def _format_outcomes(self, outcomes: List[Dict[str, Any]]) -> str:
        if not outcomes:
            return "No recent outcomes available."
        formatted = []
        for outcome in outcomes:
            formatted.append(
                f"- Activity: {outcome.get('activity_name', 'Unknown')}\n"
                f"  Engagement: {outcome.get('engagement')}/5, "
                f"Stress: {outcome.get('stress')}/5, "
                f"Success: {outcome.get('success')}/5\n"
                f"  Notes: {outcome.get('notes', 'None')}"
            )
        return "\n".join(formatted)


# Helper functions for formatting
def format_activities_for_llm(activities: List[Dict[str, Any]]) -> str:
    """Format activities for LLM prompt."""
    formatted = []
    for idx, act in enumerate(activities, 1):
        act_id = str(act.get('id', act.get('_id', '')))
        act_name = act.get('activity_name', act.get('name', 'Unknown'))
        materials = act.get('materials', [])
        if isinstance(materials, str):
            materials = [m.strip() for m in materials.split(',') if m.strip()]
        formatted.append(
            f"{idx}. ID: {act_id} | Name: {act_name}\n"
            f"   Domain: {act.get('domain', '')}\n"
            f"   Goal: {act.get('goal', '')}\n"
            f"   Skills: {', '.join(act.get('skills_targeted', [])) if isinstance(act.get('skills_targeted'), list) else act.get('skills_targeted', '')}\n"
            f"   Duration: {act.get('time_required_minutes', 15)} minutes\n"
            f"   Materials: {', '.join(materials) if materials else 'None'}"
        )
    return "\n\n".join(formatted)


def format_outcomes_for_llm(outcomes: List[Dict[str, Any]]) -> str:
    """Format outcomes for LLM prompt."""
    if not outcomes:
        return "No recent outcomes available."
    formatted = []
    for outcome in outcomes[:3]:
        formatted.append(
            f"Activity {outcome.get('activity_id', 'unknown')}: "
            f"Engagement={outcome.get('engagement', 3)}/5, "
            f"Success={outcome.get('success', 3)}/5, "
            f"Stress={outcome.get('stress', 3)}/5"
        )
    return "\n".join(formatted)


def get_llm_provider() -> LLMProvider:
    if settings.llm_provider == "openai":
        return OpenAIProvider()
    elif settings.llm_provider == "ollama":
        return OllamaProvider()
    else:
        raise ValueError(f"Unknown LLM provider: {settings.llm_provider}. Use 'openai' or 'ollama'")

