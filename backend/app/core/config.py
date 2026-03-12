from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "FDD Engineering API"
    api_prefix: str = "/api/v1"
    environment: str = "development"
    app_debug: bool = True
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/fdd"
    sqlalchemy_echo: bool = False
    base_dir: Path = Path(__file__).resolve().parents[2]
    default_fdd_template_path: Path = Path(__file__).resolve().parents[1] / "domains" / "documents" / "templates" / "default_fdd_template.docx"
    document_export_dir: Path = Path(__file__).resolve().parents[2] / "storage" / "exports"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
