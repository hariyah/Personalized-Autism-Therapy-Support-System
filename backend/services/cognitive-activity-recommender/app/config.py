from pydantic_settings import BaseSettings
from typing import Literal, Optional


class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "cognitive_plan"
    openai_api_key: str = ""
    llm_provider: Literal["openai", "ollama"] = "ollama"
    ollama_endpoint: str = "http://localhost:11434/api/chat"
    ollama_model: str = "llama3.2:3b"  # Use 3B model by default (smallest, works on most systems)
    ollama_use_cpu: bool = False  # Set to True to force CPU mode (slower but uses RAM instead of VRAM)
    jwt_secret_key: str = "your-secret-key-change-in-production-use-env-var"
    # Common auth: same as autism-profile-builder SECRET_KEY so JWT from profile-builder is valid here
    secret_key: Optional[str] = None  # env SECRET_KEY (match profile-builder)
    auth_secret_key: Optional[str] = None  # env AUTH_SECRET_KEY (alternative)

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

