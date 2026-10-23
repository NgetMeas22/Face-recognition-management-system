from datetime import datetime
from enum import StrEnum

from sqlalchemy import CheckConstraint, Float, ForeignKey, SmallInteger, String, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, BigId, IdMixin, enum_column
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
    __table_args__ = (
        CheckConstraint("face_index >= 0", name="face_index_non_negative"),
        # Cosine similarity of L2-normalised embeddings lies in [-1, 1].
        CheckConstraint("score IS NULL OR score BETWEEN -1 AND 1", name="score_range"),
        CheckConstraint("second_score IS NULL OR second_score BETWEEN -1 AND 1", name="second_score_range"),
        CheckConstraint("review_threshold <= accept_threshold", name="thresholds_ordered"),
    )

    request_id: Mapped[str] = mapped_column(String(36), index=True)
    face_index: Mapped[int] = mapped_column(SmallInteger, default=0, server_default=text("0"))
    mode: Mapped[ScanMode] = mapped_column(enum_column(ScanMode, "scan_mode"))
    outcome: Mapped[ScanOutcome] = mapped_column(enum_column(ScanOutcome, "scan_outcome"), index=True)
    matched_person_id: Mapped[int | None] = mapped_column(
        BigId, ForeignKey("people.id", ondelete="SET NULL"), index=True
    )
    candidate_person_id: Mapped[int | None] = mapped_column(
        BigId, ForeignKey("people.id", ondelete="SET NULL"), index=True
    )
    score: Mapped[float | None] = mapped_column(Float)
    second_score: Mapped[float | None] = mapped_column(Float)
    accept_threshold: Mapped[float] = mapped_column(Float)
    review_threshold: Mapped[float] = mapped_column(Float)
    quality_score: Mapped[float | None] = mapped_column(Float)
    liveness_result: Mapped[LivenessResult] = mapped_column(
        enum_column(LivenessResult, "liveness_result"),
        default=LivenessResult.NOT_RUN,
        server_default=LivenessResult.NOT_RUN.value,
    )
    model_name: Mapped[str] = mapped_column(String(50))
    review_status: Mapped[ReviewStatus] = mapped_column(
        enum_column(ReviewStatus, "review_status"),
        default=ReviewStatus.NONE,
        server_default=ReviewStatus.NONE.value,
    )
    reviewed_by: Mapped[int | None] = mapped_column(BigId, ForeignKey("users.id", ondelete="SET NULL"))
    reviewed_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    scanned_by: Mapped[int] = mapped_column(BigId, ForeignKey("users.id", ondelete="RESTRICT"))
    client_ip: Mapped[str | None] = mapped_column(String(45))
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, server_default=func.now(), index=True)
