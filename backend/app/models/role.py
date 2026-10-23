from sqlalchemy import Boolean, Column, ForeignKey, String, Table, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import TABLE_ARGS, Base, BigId, IdMixin, TimestampMixin

role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", BigId, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", BigId, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
    **TABLE_ARGS,
)


class Permission(IdMixin, Base):
    __tablename__ = "permissions"
    __table_args__ = TABLE_ARGS

    code: Mapped[str] = mapped_column(String(64), unique=True)
    description: Mapped[str] = mapped_column(String(255))


class Role(IdMixin, TimestampMixin, Base):
    __tablename__ = "roles"
    __table_args__ = TABLE_ARGS

    name: Mapped[str] = mapped_column(String(50), unique=True)
    display_name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(String(255))
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("0"))

    permissions: Mapped[list[Permission]] = relationship(secondary=role_permissions, order_by=Permission.code)

    @property
    def permission_codes(self) -> frozenset[str]:
        return frozenset(p.code for p in self.permissions)
