"""Test fixtures.

Tests run against a real PostgreSQL database (POSTGRES_TEST_DB, default facetrack_test). Its
schema is dropped and rebuilt by Alembic at the start of the run. Each test runs inside a transaction
that is rolled back afterwards, so tests never see each other's data.
"""

from collections.abc import Callable, Iterator
from typing import Any

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import Engine, create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.core.config import BACKEND_DIR, get_settings
from app.core.rate_limit import limiter
from app.db.session import get_db
from app.main import app
from app.models import User
from app.services import seed_service, user_service

TEST_PASSWORD = "Correct-Horse-42"


def _test_url(db_name: str | None = None) -> str:
    parsed = make_url(get_settings().sqlalchemy_test_url)
    if db_name:
        parsed = parsed.set(database=db_name)
    if not parsed.database or "test" not in parsed.database:
        pytest.exit(f"Refusing to use '{parsed.database}' for tests: name must contain 'test'.", returncode=2)
    return parsed.render_as_string(hide_password=False)


def reset_schema(url: str) -> None:
    """Drops and recreates the `public` schema of a *test* database (owned by the app role)."""
    parsed = make_url(url)
    engine = create_engine(parsed)
    try:
        with engine.begin() as conn:
            conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
            conn.execute(text("CREATE SCHEMA public"))
    except OperationalError as exc:
        pytest.exit(
            f"Cannot prepare test database '{parsed.database}' on {parsed.host}:{parsed.port}. Is PostgreSQL "
            f"running, and did you run scripts/create_database.sql (it creates the test databases)?\n{exc}",
            2,
        )
    finally:
        engine.dispose()


def alembic_config(url: str) -> Config:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", url.replace("%", "%%"))
    return config


@pytest.fixture(scope="session")
def engine() -> Iterator[Engine]:
    url = _test_url()
    reset_schema(url)
    command.upgrade(alembic_config(url), "head")
    eng = create_engine(url)
    with Session(eng) as db:
        seed_service.seed_core(db)
        db.commit()
    yield eng
    eng.dispose()


@pytest.fixture
def db(engine: Engine) -> Iterator[Session]:
    connection = engine.connect()
    outer = connection.begin()
    session = Session(
        bind=connection, join_transaction_mode="create_savepoint", autoflush=False, expire_on_commit=False
    )
    try:
        yield session
    finally:
        session.close()
        outer.rollback()
        connection.close()


@pytest.fixture
def client(db: Session) -> Iterator[TestClient]:
    app.dependency_overrides[get_db] = lambda: db
    limiter.reset()
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    limiter.reset()


@pytest.fixture
def make_user(db: Session) -> Callable[..., User]:
    counter = iter(range(1, 10_000))

    def factory(role: str = "admin", *, username: str | None = None, password: str = TEST_PASSWORD, **kw: Any):
        n = next(counter)
        username = username or f"{role}{n}"
        user = user_service.create_user(
            db,
            username=username,
            email=kw.pop("email", f"{username}@example.com"),
            full_name=kw.pop("full_name", f"Test {role.title()} {n}"),
            password=password,
            role_name=role,
        )
        for key, value in kw.items():
            setattr(user, key, value)
        db.commit()
        return user

    return factory


def login(client: TestClient, username: str, password: str = TEST_PASSWORD) -> dict[str, Any]:
    response = client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200, response.text
    return response.json()


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
