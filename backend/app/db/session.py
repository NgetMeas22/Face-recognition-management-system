"""Engine and session factory."""

from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


def make_engine(url: str, *, echo: bool = False, pool_size: int = 5) -> Engine:
    return create_engine(
        url,
        echo=echo,
        pool_size=pool_size,
        pool_pre_ping=True,  # replace connections dropped by a server restart or idle timeout
        pool_recycle=3600,
    )


@lru_cache
def get_engine() -> Engine:
    settings = get_settings()
    return make_engine(settings.sqlalchemy_url, echo=settings.db_echo, pool_size=settings.db_pool_size)


@lru_cache
def get_sessionmaker() -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine(), autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """FastAPI dependency: one session per request, rolled back on error."""
    db = get_sessionmaker()()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
