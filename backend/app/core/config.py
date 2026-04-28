from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "sqlite:///./backend/data/app.db"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    AUTH_ENABLED: bool = False
    SECRET_KEY: str = "dev-only-change-when-enabling-auth"

    DEFAULT_UNIVERSE_FILE: str = "backend/app/data/sp500.txt"
    REFRESH_BATCH_SIZE: int = 25
    REFRESH_RATE_LIMIT_SECONDS: float = 0.5

    LOG_LEVEL: str = "INFO"


settings = Settings()
