from functools import lru_cache
from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    app_name: str = "VVIC CUSTOMER EFF API"

    # ==========================
    # DATABASE
    # ==========================

    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "VVIC"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "123456"

    # ==========================
    # DATA MODE
    # ==========================

    data_mode: str = "database"

    # ==========================
    # OTHER SETTINGS
    # ==========================

    cors_origins: str = (
        "http://localhost:5173,"
        "http://172.16.88.141:5173"
    )

    cache_ttl_seconds: int = 60
    default_target: float = 0.60

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

    # ==========================
    # DATABASE URL
    # ==========================

    @property
    def database_url(self) -> str:

        password = quote_plus(
            str(self.DB_PASSWORD)
        )

        return (
            f"postgresql+psycopg://"
            f"{self.DB_USER}:"
            f"{password}@"
            f"{self.DB_HOST}:"
            f"{self.DB_PORT}/"
            f"{self.DB_NAME}"
        )

    # ==========================
    # CORS
    # ==========================

    @property
    def cors_origin_list(self):
        return [
            x.strip()
            for x in self.cors_origins.split(",")
            if x.strip()
        ]


@lru_cache
def get_settings():
    return Settings()