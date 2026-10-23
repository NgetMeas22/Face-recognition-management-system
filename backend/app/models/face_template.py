from datetime import datetime
from enum import StrEnum

from sqlalchemy import Enum, Float, ForeignKey, Index, LargeBinary, SmallInteger, String
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import TABLE_ARGS, Base, BigId, CreatedAtMixin, IdMixin
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
    __table_args__ = (Index("ix_face_templates_person_status", "person_id", "status"), TABLE_ARGS)

    person_id: Mapped[int] = mapped_column(BigId, ForeignKey("people.id", ondelete="CASCADE"))
    # AES-256-GCM: nonce (12) + ciphertext (dim * 4) + tag (16)
    embedding_ciphertext: Mapped[bytes] = mapped_column(
        LargeBinary().with_variant(mysql.VARBINARY(1024), "mysql")
    )
    key_id: Mapped[str] = mapped_column(String(16))
    model_name: Mapped[str] = mapped_column(String(50))
    detector_name: Mapped[str] = mapped_column(String(50))
    embedding_dim: Mapped[int] = mapped_column(SmallInteger)
    quality_score: Mapped[float] = mapped_column(Float)
    detection_score: Mapped[float] = mapped_column(Float)
    source: Mapped[FaceSource] = mapped_column(Enum(FaceSource, name="face_source"))
    status: Mapped[TemplateStatus] = mapped_column(
        Enum(TemplateStatus, name="template_status"),
        default=TemplateStatus.PENDING,
        server_default=TemplateStatus.PENDING.value,
    )
    created_by: Mapped[int] = mapped_column(BigId, ForeignKey("users.id", ondelete="RESTRICT"))
    approved_by: Mapped[int | None] = mapped_column(BigId, ForeignKey("users.id", ondelete="SET NULL"))
    approved_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
