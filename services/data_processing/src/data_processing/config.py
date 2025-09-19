"""Configuration management for the data processing service."""
import os
from pathlib import Path
from typing import Optional
from enum import Enum

from pydantic import BaseSettings, Field


class ProcessingTier(Enum):
    """Processing tiers for different subscription levels."""
    FREE = "free"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API Configuration
    api_host: str = Field("0.0.0.0", env="API_HOST")
    api_port: int = Field(8000, env="API_PORT")
    debug: bool = Field(False, env="DEBUG")

    # Data Processing
    max_workers: int = Field(4, env="MAX_WORKERS")

    # Email Processing Configuration
    email_processing_mode: str = Field("free", env="EMAIL_PROCESSING_MODE")
    enable_ai_processing: bool = Field(True, env="ENABLE_AI_PROCESSING")

    # Paths
    base_dir: Path = Path(__file__).parent.parent.parent
    data_dir: Path = base_dir / "data"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


def get_settings() -> Settings:
    """Get application settings."""
    return Settings()


# Global settings instance
settings = get_settings()

# Create data directory if it doesn't exist
settings.data_dir.mkdir(exist_ok=True)


class EmailProcessingConfig:
    """Configuration helper for email processing system."""

    def __init__(self, settings_instance: Settings):
        self.settings = settings_instance

    def get_processing_mode(self, user_tier: Optional[str] = None) -> str:
        """
        Determine processing mode based on user tier and configuration.

        Args:
            user_tier: User's subscription tier ('free', 'premium', 'enterprise')

        Returns:
            Processing mode ('free' or 'ai')
        """
        # If AI processing is disabled globally, always use free mode
        if not self.settings.enable_ai_processing:
            return 'free'

        # If user tier is provided, use tier-based logic
        if user_tier:
            user_tier = user_tier.lower()
            if user_tier in ['premium', 'enterprise']:
                return 'ai'
            else:
                return 'free'

        # Fallback to environment configuration
        return self.settings.email_processing_mode

    def should_use_ai_processing(self, user_tier: Optional[str] = None) -> bool:
        """
        Check if AI processing should be used.

        Args:
            user_tier: User's subscription tier

        Returns:
            True if AI processing should be used
        """
        return self.get_processing_mode(user_tier) == 'ai'

    def get_rate_limits(self, user_tier: Optional[str] = None) -> dict:
        """
        Get rate limits based on user tier.

        Args:
            user_tier: User's subscription tier

        Returns:
            Dictionary with rate limit settings
        """
        if not user_tier:
            user_tier = 'free'

        user_tier = user_tier.lower()

        rate_limits = {
            'free': {
                'max_emails_per_hour': 100,
                'max_emails_per_day': 500,
                'ai_processing': False
            },
            'premium': {
                'max_emails_per_hour': 1000,
                'max_emails_per_day': 5000,
                'ai_processing': True
            },
            'enterprise': {
                'max_emails_per_hour': 10000,
                'max_emails_per_day': 50000,
                'ai_processing': True
            }
        }

        return rate_limits.get(user_tier, rate_limits['free'])


# Global email processing configuration
email_config = EmailProcessingConfig(settings)


def get_processing_mode_for_user(user_tier: Optional[str] = None) -> str:
    """
    Convenience function to get processing mode for a user.

    Args:
        user_tier: User's subscription tier

    Returns:
        Processing mode ('free' or 'ai')
    """
    return email_config.get_processing_mode(user_tier)


def can_use_ai_processing(user_tier: Optional[str] = None) -> bool:
    """
    Convenience function to check if user can use AI processing.

    Args:
        user_tier: User's subscription tier

    Returns:
        True if AI processing is allowed
    """
    return email_config.should_use_ai_processing(user_tier)
