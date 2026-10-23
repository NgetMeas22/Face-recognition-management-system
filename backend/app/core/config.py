"""Application settings, loaded from environment variables and backend/.env."""

from functools import lru_cache
from pathlib import Path
from typing import Annotated, Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]

APP_VERSION = "0.2.0"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "FaceTrack AI"
    app_env: Literal["development", "test", "production"] = "development"
    debug: bool = False

    # Database
    database_url: str
    test_database_url: str | None = None
    db_echo: bool = False
    db_pool_size: int = Field(default=5, ge=1, le=50)

    # Tokens
    jwt_secret: str = Field(min_length=32)
    jwt_algorithm: Literal["HS256"] = "HS256"
    jwt_issuer: str = "facetrack-api"
    access_token_minutes: int = Field(default=15, ge=1, le=120)
    refresh_token_days: int = Field(default=7, ge=1, le=90)
    refresh_cookie_name: str = "ft_refresh"
    cookie_secure: bool = False

    # Login protection
    login_max_failures: int = Field(default=10, ge=3, le=100)
    login_lockout_minutes: int = Field(default=15, ge=1, le=1440)
    login_rate_limit_per_minute: int = Field(default=5, ge=1, le=1000)
    login_ip_rate_limit_per_minute: int = Field(default=30, ge=1, le=10000)

    # HTTP
    cors_origins: Annotated[list[str], NoDecode] = ["http://localhost:5173"]

    # Locale
    timezone: str = "Asia/Phnom_Penh"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("timezone")
    @classmethod
    def _check_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as exc:
            raise ValueError(f"Unknown timezone: {value}") from exc
        return value

    @model_validator(mode="after")
    def _production_guards(self) -> "Settings":
        if self.app_env == "production":
            if self.debug:
                raise ValueError("DEBUG must be false in production")
            if not self.cookie_secure:
                raise ValueError("COOKIE_SECURE must be true in production")
        return self

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def tz(self) -> ZoneInfo:
        return ZoneInfo(self.timezone)


@lru_cache
def get_settings() -> Settings:
    return Settings()
