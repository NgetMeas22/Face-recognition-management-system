from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, SmallInteger, String, func, text, true
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, BigId, CreatedAtMixin, IdMixin, TimestampMixin
from app.db.types import UTCDateTime, utcnow
from app.models.role import Role


class User(IdMixin, TimestampMixin, Base):
    """A system operator account (not a person being recognised)."""

    __tablename__ = "users"
    __table_args__ = (
        # PostgreSQL compares text case-sensitively, so uniqueness is only meaningful if the app
        # stores these normalised. The constraint makes that a database guarantee.
        CheckConstraint("username = lower(username)", name="username_lowercase"),
        CheckConstraint("email = lower(email)", name="email_lowercase"),
        CheckConstraint("failed_login_count >= 0", name="failed_login_count_non_negative"),
    )

    username: Mapped[str] = mapped_column(String(50), unique=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    full_name: Mapped[str] = mapped_column(String(150))
    password_hash: Mapped[str] = mapped_column(String(255))
    role_id: Mapped[int] = mapped_column(BigId, ForeignKey("roles.id", ondelete="RESTRICT"), index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=true())
    failed_login_count: Mapped[int] = mapped_column(SmallInteger, default=0, server_default=text("0"))
    locked_until: Mapped[datetime | None] = mapped_column(UTCDateTime)
    last_login_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    password_changed_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, server_default=func.now())

    role: Mapped[Role] = relationship()
    sessions: Mapped[list["UserSession"]] = relationship(back_populates="user", passive_deletes=True)


class UserSession(IdMixin, CreatedAtMixin, Base):
    """One refresh token in a sign-in's rotation family. Only the token's SHA-256 hash is stored.

    rotated_at: this refresh token was exchanged for a new one. Presenting it again means theft.
    revoked_at: the sign-in ended (logout, password change, reuse). Access tokens tied to it die.
    """

    __tablename__ = "user_sessions"

    user_id: Mapped[int] = mapped_column(BigId, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    family_id: Mapped[str] = mapped_column(String(36), index=True)
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime)
    rotated_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    revoked_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    ip_address: Mapped[str | None] = mapped_column(String(45))
    user_agent: Mapped[str | None] = mapped_column(String(255))

    user: Mapped[User] = relationship(back_populates="sessions")
