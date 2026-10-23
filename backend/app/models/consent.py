from enum import StrEnum

from sqlalchemy import Enum, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import TABLE_ARGS, Base, BigId, CreatedAtMixin, IdMixin


class ConsentType(StrEnum):
    BIOMETRIC_FACE = "BIOMETRIC_FACE"


class ConsentAction(StrEnum):
    GRANTED = "GRANTED"
    WITHDRAWN = "WITHDRAWN"


class ConsentMethod(StrEnum):
    PAPER_FORM = "PAPER_FORM"
    DIGITAL_FORM = "DIGITAL_FORM"
    WITNESSED_VERBAL = "WITNESSED_VERBAL"


class ConsentRecord(IdMixin, CreatedAtMixin, Base):
    """Append-only consent history. The latest row per (person, type) is the current state."""

    __tablename__ = "consent_records"
    __table_args__ = (Index("ix_consent_person", "person_id", "consent_type", "created_at"), TABLE_ARGS)

    person_id: Mapped[int] = mapped_column(BigId, ForeignKey("people.id", ondelete="CASCADE"))
    consent_type: Mapped[ConsentType] = mapped_column(Enum(ConsentType, name="consent_type"))
    action: Mapped[ConsentAction] = mapped_column(Enum(ConsentAction, name="consent_action"))
    method: Mapped[ConsentMethod] = mapped_column(Enum(ConsentMethod, name="consent_method"))
    notice_version: Mapped[str] = mapped_column(String(20))
    evidence_ref: Mapped[str | None] = mapped_column(String(255))
    recorded_by: Mapped[int] = mapped_column(BigId, ForeignKey("users.id", ondelete="RESTRICT"))
    notes: Mapped[str | None] = mapped_column(String(500))
