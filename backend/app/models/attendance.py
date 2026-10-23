from datetime import date, datetime
from enum import StrEnum

from sqlalchemy import Boolean, Date, Enum, ForeignKey, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import TABLE_ARGS, Base, BigId, CreatedAtMixin, IdMixin
from app.db.types import UTCDateTime


class AttendanceEventType(StrEnum):
    CHECK_IN = "CHECK_IN"
    CHECK_OUT = "CHECK_OUT"


class AttendanceMethod(StrEnum):
    FACE_LIVE = "FACE_LIVE"
    FACE_UPLOAD = "FACE_UPLOAD"
    MANUAL = "MANUAL"
    ID_LOOKUP = "ID_LOOKUP"


class Punctuality(StrEnum):
    ON_TIME = "ON_TIME"
    LATE = "LATE"


class AttendanceRecord(IdMixin, CreatedAtMixin, Base):
    """A check-in or check-out event. Corrections void the original and insert a replacement."""

    __tablename__ = "attendance_records"
    __table_args__ = (
        Index("ix_att_person_time", "person_id", "occurred_at"),
        Index("ix_att_date_person", "attendance_date", "person_id"),
        TABLE_ARGS,
    )

    person_id: Mapped[int] = mapped_column(BigId, ForeignKey("people.id", ondelete="CASCADE"))
    event_type: Mapped[AttendanceEventType] = mapped_column(Enum(AttendanceEventType, name="attendance_event_type"))
    occurred_at: Mapped[datetime] = mapped_column(UTCDateTime)
    attendance_date: Mapped[date] = mapped_column(Date)
    method: Mapped[AttendanceMethod] = mapped_column(Enum(AttendanceMethod, name="attendance_method"))
    punctuality: Mapped[Punctuality | None] = mapped_column(Enum(Punctuality, name="punctuality"))
    scan_event_id: Mapped[int | None] = mapped_column(BigId, ForeignKey("scan_events.id", ondelete="SET NULL"))
    verified_by_review: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("0"))
    is_voided: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("0"))
    void_reason: Mapped[str | None] = mapped_column(String(255))
    corrects_id: Mapped[int | None] = mapped_column(BigId, ForeignKey("attendance_records.id", ondelete="SET NULL"))
    note: Mapped[str | None] = mapped_column(String(255))
    recorded_by: Mapped[int] = mapped_column(BigId, ForeignKey("users.id", ondelete="RESTRICT"))
