from datetime import datetime
from enum import StrEnum

from sqlalchemy import CheckConstraint, Float, ForeignKey, Index, LargeBinary, SmallInteger, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, BigId, CreatedAtMixin, IdMixin, enum_column
from app.db.types import UTCDateTime


class FaceSource(StrEnum):
    UPLOAD = "UPLOAD"
    WEBCAM = "WEBCAM"


class TemplateStatus(StrEnum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REVOKED = "REVOKED"


class FaceTemplate(IdMixin, CreatedAtMixin, Base):
    """An encrypted face embedding. The source image is never stored."""

    __tablename__ = "face_templates"
    __table_args__ = (
        Index("ix_face_templates_person_status", "person_id", "status"),
        # AES-256-GCM: nonce (12) + ciphertext (dim * 4) + tag (16); 1024 bytes allows up to 249 dims.
        CheckConstraint("octet_length(embedding_ciphertext) BETWEEN 29 AND 1024", name="ciphertext_size"),
        CheckConstraint("embedding_dim > 0", name="embedding_dim_positive"),
        CheckConstraint("quality_score BETWEEN 0 AND 1", name="quality_score_range"),
        CheckConstraint("detection_score BETWEEN 0 AND 1", name="detection_score_range"),
        CheckConstraint("(status = 'APPROVED') = (approved_at IS NOT NULL)", name="approved_at_matches_status"),
    )

    person_id: Mapped[int] = mapped_column(BigId, ForeignKey("people.id", ondelete="CASCADE"))
    embedding_ciphertext: Mapped[bytes] = mapped_column(LargeBinary)  # bytea
    key_id: Mapped[str] = mapped_column(String(16))
    model_name: Mapped[str] = mapped_column(String(50))
    detector_name: Mapped[str] = mapped_column(String(50))
    embedding_dim: Mapped[int] = mapped_column(SmallInteger)
    quality_score: Mapped[float] = mapped_column(Float)
    detection_score: Mapped[float] = mapped_column(Float)
    source: Mapped[FaceSource] = mapped_column(enum_column(FaceSource, "face_source"))
    status: Mapped[TemplateStatus] = mapped_column(
        enum_column(TemplateStatus, "template_status"),
        default=TemplateStatus.PENDING,
        server_default=TemplateStatus.PENDING.value,
    )
    created_by: Mapped[int] = mapped_column(BigId, ForeignKey("users.id", ondelete="RESTRICT"))
    approved_by: Mapped[int | None] = mapped_column(BigId, ForeignKey("users.id", ondelete="SET NULL"))
    approved_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
