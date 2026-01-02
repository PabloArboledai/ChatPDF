from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://chatpdf:chatpdf@postgres:5432/chatpdf"
    celery_broker_url: str = "redis://redis:6379/0"
    data_dir: str = "/data"


settings = Settings()
