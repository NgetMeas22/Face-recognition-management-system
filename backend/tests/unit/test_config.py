import pytest
from pydantic import ValidationError

from app.core.config import Settings

BASE = {"database_url": "mysql+pymysql://u:p@localhost/db", "jwt_secret": "s" * 40}


def make(**overrides) -> Settings:
    return Settings(_env_file=None, **{**BASE, **overrides})


def test_cors_origins_from_comma_separated_string() -> None:
    assert make(cors_origins="http://a.test, http://b.test").cors_origins == ["http://a.test", "http://b.test"]


def test_short_jwt_secret_is_rejected() -> None:
    with pytest.raises(ValidationError):
        make(jwt_secret="too-short")


def test_unknown_timezone_is_rejected() -> None:
    with pytest.raises(ValidationError, match="Unknown timezone"):
        make(timezone="Mars/Olympus")


def test_production_requires_secure_cookies_and_no_debug() -> None:
    with pytest.raises(ValidationError, match="COOKIE_SECURE"):
        make(app_env="production")
    with pytest.raises(ValidationError, match="DEBUG"):
        make(app_env="production", cookie_secure=True, debug=True)
    assert make(app_env="production", cookie_secure=True).is_production
