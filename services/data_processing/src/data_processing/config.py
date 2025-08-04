""Configuration management for the data processing service."""
import os
from pathlib import Path
from typing import Optional

from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Configuration
    api_host: str = Field("0.0.0.0", env="API_HOST")
    api_port: int = Field(8000, env="API_PORT")
    debug: bool = Field(False, env="DEBUG")
    
    # Data Processing
    max_workers: int = Field(4, env="MAX_WORKERS")
    
    # Paths
    base_dir: Path = Path(__file__).parent.parent.parent
    data_dir: Path = base_dir / "data"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


def get_settings() -> Settings:
    ""Get application settings."""
    return Settings()


# Global settings instance
settings = get_settings()

# Create data directory if it doesn't exist
settings.data_dir.mkdir(exist_ok=True)
