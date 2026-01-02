from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "dev"

    database_url: str = "postgresql+psycopg://chatpdf:chatpdf@postgres:5432/chatpdf"

    celery_broker_url: str = "redis://redis:6379/0"

    # optional: Celery result backend
    celery_result_backend: str = "redis://redis:6379/1"

    # Filesystem storage (mounted volume)
    data_dir: str = "/data"

    # CORS
    cors_origins: str = "*"


settings = Settings()
