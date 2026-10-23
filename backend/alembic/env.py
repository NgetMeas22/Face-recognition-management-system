from logging.config import fileConfig
from typing import Any

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.core.config import get_settings
from app.db.base import Base
from app.db.types import UTCDateTime
import app.models  # noqa: F401  (registers every table on Base.metadata)

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)

# Tests pass an explicit URL; normal runs use DATABASE_URL from .env.
if not config.get_main_option("sqlalchemy.url"):
    config.set_main_option("sqlalchemy.url", get_settings().database_url.replace("%", "%%"))

target_metadata = Base.metadata


def render_item(type_: str, obj: Any, autogen_context: Any) -> str | bool:
    """Render UTCDateTime as plain DATETIME(6) so migrations don't import app code."""
    if type_ == "type" and isinstance(obj, UTCDateTime):
        autogen_context.imports.add("from sqlalchemy.dialects import mysql")
        return "mysql.DATETIME(fsp=6)"
    return False


COMMON_OPTS: dict[str, Any] = {
    "target_metadata": target_metadata,
    "compare_type": True,
    "render_item": render_item,
}


def run_migrations_offline() -> None:
    context.configure(url=config.get_main_option("sqlalchemy.url"), literal_binds=True, **COMMON_OPTS)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}), prefix="sqlalchemy.", poolclass=pool.NullPool
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, **COMMON_OPTS)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
