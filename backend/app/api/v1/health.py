import logging
from functools import lru_cache

from alembic.config import Config
from alembic.script import ScriptDirectory
from fastapi import APIRouter, Response, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.deps import DbSession
from app.core.config import APP_VERSION, BACKEND_DIR, get_settings
from app.db.types import utcnow
from app.schemas.health import HealthOut, ReadinessOut

router = APIRouter(prefix="/health", tags=["health"])
logger = logging.getLogger(__name__)


@lru_cache
def _head_revision() -> str | None:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    return ScriptDirectory.from_config(config).get_current_head()


@router.get("", response_model=HealthOut)
def health() -> HealthOut:
    """Liveness: the process is up. Does not touch the database."""
    settings = get_settings()
    return HealthOut(
        status="ok", app=settings.app_name, version=APP_VERSION, environment=settings.app_env, time=utcnow()
    )


@router.get("/ready", response_model=ReadinessOut, responses={503: {"model": ReadinessOut}})
def ready(db: DbSession, response: Response) -> ReadinessOut:
    """Readiness: the database is reachable and migrations are applied."""
    head = _head_revision()
    try:
        db.execute(text("SELECT 1"))
        current = db.execute(text("SELECT version_num FROM alembic_version")).scalar()
    except SQLAlchemyError:
        logger.warning("Readiness check failed", exc_info=True)
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return ReadinessOut(
            status="unavailable", database="unavailable", migrations="unknown",
            current_revision=None, head_revision=head,
        )

    up_to_date = current == head
    if not up_to_date:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return ReadinessOut(
        status="ok" if up_to_date else "degraded",
        database="ok",
        migrations="up_to_date" if up_to_date else "pending",
        current_revision=current,
        head_revision=head,
    )
