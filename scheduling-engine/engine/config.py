"""Configuration management for the scheduling engine."""

import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Centralized configuration for the scheduling engine."""

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://user:password@localhost:5432/timeintel"
    )

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # GCP
    GCP_PROJECT: str = os.getenv("GCP_PROJECT", "tmc-timeintel-prod")
    VERTEX_AI_LOCATION: str = os.getenv("VERTEX_AI_LOCATION", "us-central1")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")

    # Scheduling parameters
    SCHEDULING_HORIZON_DAYS: int = int(os.getenv("SCHEDULING_HORIZON_DAYS", "14"))
    MIN_BLOCK_MINS: int = int(os.getenv("MIN_BLOCK_MINS", "30"))
    BUFFER_BETWEEN_BLOCKS_MINS: int = int(os.getenv("BUFFER_BETWEEN_BLOCKS_MINS", "5"))
    MAX_SCHEDULING_TIME_SECS: int = int(os.getenv("MAX_SCHEDULING_TIME_SECS", "30"))

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8081"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Admin
    ADMIN_EMAIL: str = "haseeb@tmcltd.ai"

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    @classmethod
    def validate(cls) -> None:
        """Validate critical configuration values."""
        if not cls.GCP_PROJECT:
            raise ValueError("GCP_PROJECT must be set")
        if not cls.DATABASE_URL:
            raise ValueError("DATABASE_URL must be set")


config = Config()
