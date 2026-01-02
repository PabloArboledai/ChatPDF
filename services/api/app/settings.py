from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "dev"

    # Database connection from environment variables
    postgres_user: str = "chatpdf"
    postgres_password: str = "chatpdf"
    postgres_host: str = "postgres"
    postgres_port: int = 5432
    postgres_db: str = "chatpdf"

    celery_broker_url: str = "redis://redis:6379/0"

    # optional: Celery result backend
    celery_result_backend: str = "redis://redis:6379/1"

    # Filesystem storage (mounted volume)
    data_dir: str = "/data"

    # CORS
    cors_origins: str = "*"

    @property
    def database_url(self) -> str:
        """Build database URL from environment variables"""
        # URL encode the password to handle special characters
        from urllib.parse import quote
        encoded_password = quote(self.postgres_password, safe='')
        return f"postgresql+psycopg://{self.postgres_user}:{encoded_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"


settings = Settings()
