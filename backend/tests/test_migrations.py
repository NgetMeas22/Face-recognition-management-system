"""The migration must match the models, and must downgrade/upgrade cleanly on PostgreSQL."""

from alembic import command
from sqlalchemy import create_engine, inspect

from app.db.base import Base
from tests.conftest import _test_url, alembic_config, reset_schema


def test_upgrade_check_downgrade_roundtrip() -> None:
    url = _test_url("facetrack_test_mig")
    reset_schema(url)
    config = alembic_config(url)
    engine = create_engine(url)
    try:
        command.upgrade(config, "head")
        tables = set(inspect(engine).get_table_names())
        assert set(Base.metadata.tables) <= tables

        # Raises if autogenerate would produce any operations (models and migrations drifted).
        command.check(config)

        command.downgrade(config, "base")
        assert set(inspect(engine).get_table_names()) == {"alembic_version"}

        command.upgrade(config, "head")
        assert set(Base.metadata.tables) <= set(inspect(engine).get_table_names())
    finally:
        engine.dispose()
