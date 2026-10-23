from datetime import date, datetime
from enum import StrEnum

from sqlalchemy import Boolean, Date, Enum, ForeignKey, Index, Integer, SmallInteger, String, text
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import TABLE_ARGS, Base, BigId, IdMixin, TimestampMixin
from app.db.types import UTCDateTime


class DepartmentKind(StrEnum):
    DEPARTMENT = "DEPARTMENT"
    CLASS = "CLASS"


class PersonType(StrEnum):
    EMPLOYEE = "EMPLOYEE"
    STUDENT = "STUDENT"


class PersonStatus(StrEnum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ARCHIVED = "ARCHIVED"


class Department(IdMixin, TimestampMixin, Base):
    """A department (employees) or a class (students)."""

    __tablename__ = "departments"
    __table_args__ = TABLE_ARGS

    code: Mapped[str] = mapped_column(String(20), unique=True)
    name: Mapped[str] = mapped_column(String(150))
    name_km: Mapped[str | None] = mapped_column(String(150))
    kind: Mapped[DepartmentKind] = mapped_column(Enum(DepartmentKind, name="department_kind"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text("1"))


class Person(IdMixin, TimestampMixin, Base):
    """An employee or student who may be enrolled for recognition."""

    __tablename__ = "people"
    __table_args__ = (Index("ix_people_name", "last_name", "first_name"), TABLE_ARGS)

    person_code: Mapped[str] = mapped_column(String(30), unique=True)
    person_type: Mapped[PersonType] = mapped_column(Enum(PersonType, name="person_type"), index=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    name_km: Mapped[str | None] = mapped_column(String(200))
    department_id: Mapped[int | None] = mapped_column(
        BigId, ForeignKey("departments.id", ondelete="RESTRICT"), index=True
    )
    position: Mapped[str | None] = mapped_column(String(100))
    email: Mapped[str | None] = mapped_column(String(255), unique=True)
    phone: Mapped[str | None] = mapped_column(String(30))
    status: Mapped[PersonStatus] = mapped_column(
        Enum(PersonStatus, name="person_status"),
        default=PersonStatus.ACTIVE,
        server_default=PersonStatus.ACTIVE.value,
        index=True,
    )
    photo_file: Mapped[str | None] = mapped_column(String(64))
    joined_on: Mapped[date | None] = mapped_column(Date)
    archived_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    erased_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    created_by: Mapped[int | None] = mapped_column(BigId, ForeignKey("users.id", ondelete="SET NULL"))
    updated_by: Mapped[int | None] = mapped_column(BigId, ForeignKey("users.id", ondelete="SET NULL"))

    department: Mapped[Department | None] = relationship()

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


class IdSequence(Base):
    """Per-prefix, per-year counter for person codes (read with SELECT ... FOR UPDATE)."""

    __tablename__ = "id_sequences"
    __table_args__ = TABLE_ARGS

    prefix: Mapped[str] = mapped_column(String(10), primary_key=True)
    year: Mapped[int] = mapped_column(SmallInteger, primary_key=True, autoincrement=False)
    next_value: Mapped[int] = mapped_column(
        Integer().with_variant(mysql.INTEGER(unsigned=True), "mysql"), default=1, server_default=text("1")
    )
