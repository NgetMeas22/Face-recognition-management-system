"""Application settings, loaded from environment variables and backend/.env."""

from functools import lru_cache
from pathlib import Path
from typing import Annotated, Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict
from sqlalchemy.engine import URL

BACKEND_DIR = Path(__file__).resolve().parents[2]
DB_DRIVER = "postgresql+psycopg"

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

    # Database (PostgreSQL via psycopg 3). Either set the POSTGRES_* parts, or a full DATABASE_URL
    # (which then wins). Building the URL from parts handles special characters in the password.
    postgres_host: str = "localhost"
    postgres_port: int = Field(default=5432, ge=1, le=65535)
    postgres_db: str = "facetrack"
    postgres_user: str = "facetrack"
    postgres_password: SecretStr = SecretStr("")
    postgres_test_db: str = "facetrack_test"
    database_url: str | None = None
    test_database_url: str | None = None
    db_echo: bool = False
    db_pool_size: int = Field(default=5, ge=1, le=50)

    # Tokens
    jwt_secret: str = Field(min_length=32)
    jwt_algorithm: Literal["HS256"] = "HS256"
    jwt_issuer: str = "facetrack-api"
    access_token_minutes: int = Field(default=15, ge=1, le=120)
    refresh_token_days: int = Field(default=7, ge=1, le=90)
    cookie_secure: bool = False

    # Login protection
    login_max_failures: int = Field(default=10, ge=3, le=100)
    login_lockout_minutes: int = Field(default=15, ge=1, le=1440)
    login_rate_limit_per_minute: int = Field(default=5, ge=1, le=1000)
    login_ip_rate_limit_per_minute: int = Field(default=30, ge=1, le=10000)

    # HTTP
    cors_origins: Annotated[list[str], NoDecode] = ["http://localhost:3000"]

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

    @field_validator("database_url", "test_database_url")
    @classmethod
    def _check_driver(cls, value: str | None) -> str | None:
        if value is not None and not value.startswith(f"{DB_DRIVER}://"):
            scheme = value.split("://", 1)[0]
            raise ValueError(f"Database URLs must use '{DB_DRIVER}://' (psycopg 3); got '{scheme}://'")
        return value

    def _url_for(self, database: str) -> str:
        return URL.create(
            DB_DRIVER,
            username=self.postgres_user,
            password=self.postgres_password.get_secret_value() or None,
            host=self.postgres_host,
            port=self.postgres_port,
            database=database,
        ).render_as_string(hide_password=False)

    @property
    def sqlalchemy_url(self) -> str:
        """The application database URL (DATABASE_URL, or built from POSTGRES_*)."""
        return self.database_url or self._url_for(self.postgres_db)

    @property
    def sqlalchemy_test_url(self) -> str:
        """The pytest database URL (TEST_DATABASE_URL, or POSTGRES_TEST_DB with the same credentials)."""
        return self.test_database_url or self._url_for(self.postgres_test_db)

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
