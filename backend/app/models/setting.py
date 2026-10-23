from datetime import datetime
from typing import Any

from sqlalchemy import JSON, ForeignKey, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import TABLE_ARGS, Base, BigId
from app.db.types import UTCDateTime, utcnow


class SystemSetting(Base):
    """Runtime-tunable settings (thresholds, attendance rules, retention)."""

    __tablename__ = "system_settings"
    __table_args__ = TABLE_ARGS

    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    value: Mapped[Any] = mapped_column(JSON)
    updated_by: Mapped[int | None] = mapped_column(BigId, ForeignKey("users.id", ondelete="SET NULL"))
    updated_at: Mapped[datetime] = mapped_column(
        UTCDateTime, default=utcnow, onupdate=utcnow, server_default=text("CURRENT_TIMESTAMP(6)")
    )


# Provisional defaults (docs/02-database-schema.md). Thresholds must be calibrated in Phase 7.
DEFAULT_SETTINGS: dict[str, Any] = {
    "recognition.accept_threshold": 0.50,
    "recognition.review_threshold": 0.363,
    "recognition.min_margin": 0.06,
    "recognition.liveness_required": False,
    "attendance.duplicate_window_minutes": 5,
    "attendance.work_start_time": "08:00",
    "attendance.late_grace_minutes": 10,
    "attendance.auto_record_on_match": True,
    "retention.scan_events_days": 90,
    "retention.audit_logs_days": 365,
    "retention.attendance_days": 1095,
    "retention.archived_biometrics_days": 30,
    "privacy.notice_version": "1.0",
}
