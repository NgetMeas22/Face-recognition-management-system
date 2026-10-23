from datetime import datetime
from enum import StrEnum

from sqlalchemy import Enum, Float, ForeignKey, SmallInteger, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import TABLE_ARGS, Base, BigId, IdMixin
from app.db.types import UTCDateTime, utcnow


class ScanMode(StrEnum):
    LIVE = "LIVE"
    UPLOAD = "UPLOAD"


class ScanOutcome(StrEnum):
    MATCH = "MATCH"
    REVIEW = "REVIEW"
    NO_MATCH = "NO_MATCH"
    LOW_QUALITY = "LOW_QUALITY"
    NO_FACE = "NO_FACE"
    LIVENESS_FAILED = "LIVENESS_FAILED"


class LivenessResult(StrEnum):
    NOT_RUN = "NOT_RUN"
    PASSED = "PASSED"
    FAILED = "FAILED"


class ReviewStatus(StrEnum):
    NONE = "NONE"
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"


class ScanEvent(IdMixin, Base):
    """One recognition decision about one face. No image or embedding is stored."""

    __tablename__ = "scan_events"
    __table_args__ = TABLE_ARGS

    request_id: Mapped[str] = mapped_column(String(36), index=True)
    face_index: Mapped[int] = mapped_column(SmallInteger, default=0, server_default=text("0"))
    mode: Mapped[ScanMode] = mapped_column(Enum(ScanMode, name="scan_mode"))
    outcome: Mapped[ScanOutcome] = mapped_column(Enum(ScanOutcome, name="scan_outcome"), index=True)
    matched_person_id: Mapped[int | None] = mapped_column(
        BigId, ForeignKey("people.id", ondelete="SET NULL"), index=True
    )
    candidate_person_id: Mapped[int | None] = mapped_column(BigId, ForeignKey("people.id", ondelete="SET NULL"))
    score: Mapped[float | None] = mapped_column(Float)
    second_score: Mapped[float | None] = mapped_column(Float)
    accept_threshold: Mapped[float] = mapped_column(Float)
    review_threshold: Mapped[float] = mapped_column(Float)
    quality_score: Mapped[float | None] = mapped_column(Float)
    liveness_result: Mapped[LivenessResult] = mapped_column(
        Enum(LivenessResult, name="liveness_result"),
        default=LivenessResult.NOT_RUN,
        server_default=LivenessResult.NOT_RUN.value,
    )
    model_name: Mapped[str] = mapped_column(String(50))
    review_status: Mapped[ReviewStatus] = mapped_column(
        Enum(ReviewStatus, name="review_status"),
        default=ReviewStatus.NONE,
        server_default=ReviewStatus.NONE.value,
    )
    reviewed_by: Mapped[int | None] = mapped_column(BigId, ForeignKey("users.id", ondelete="SET NULL"))
    reviewed_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    scanned_by: Mapped[int] = mapped_column(BigId, ForeignKey("users.id", ondelete="RESTRICT"))
    client_ip: Mapped[str | None] = mapped_column(String(45))
    created_at: Mapped[datetime] = mapped_column(
        UTCDateTime, default=utcnow, server_default=text("CURRENT_TIMESTAMP(6)"), index=True
    )
