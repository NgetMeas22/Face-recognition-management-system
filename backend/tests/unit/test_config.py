import pytest
from pydantic import ValidationError
from sqlalchemy.engine import make_url

from app.core.config import Settings

BASE = {"jwt_secret": "s" * 40}


def make(**overrides) -> Settings:
    return Settings(_env_file=None, **{**BASE, **overrides})


def test_defaults_target_local_facetrack_database() -> None:
    url = make_url(make(postgres_password="pw").sqlalchemy_url)
    assert (url.drivername, url.host, url.port, url.database, url.username) == (
        "postgresql+psycopg",
        "localhost",
        5432,
        "facetrack",
        "facetrack",
    )
    assert make_url(make().sqlalchemy_test_url).database == "facetrack_test"


def test_url_is_built_from_parts_and_escapes_the_password() -> None:
    password = "p@ss:w/rd%#?"
    settings = make(postgres_host="db.internal", postgres_port=6543, postgres_db="ft", postgres_password=password)
    url = make_url(settings.sqlalchemy_url)
    assert (url.host, url.port, url.database) == ("db.internal", 6543, "ft")
    assert url.password == password
    assert make_url(settings.sqlalchemy_test_url).password == password


def test_database_url_overrides_parts() -> None:
    settings = make(database_url="postgresql+psycopg://u:p@h:5433/other", postgres_db="ignored")
    assert make_url(settings.sqlalchemy_url).database == "other"


@pytest.mark.parametrize(
    "url",
    ["mysql+pymysql://u:p@localhost/db", "postgresql+psycopg2://u:p@localhost/db", "postgresql://u:p@localhost/db"],
)
def test_non_psycopg3_urls_are_rejected(url: str) -> None:
    with pytest.raises(ValidationError, match="postgresql\\+psycopg://"):
        make(database_url=url)


def test_password_is_not_shown_in_repr() -> None:
    assert "hunter2-secret" not in repr(make(postgres_password="hunter2-secret"))


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
