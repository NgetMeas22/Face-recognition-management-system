"""Login, refresh-token rotation, logout and password changes."""

import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import AppError, AuthenticationError, RateLimitedError
from app.core.rate_limit import limiter
from app.core.security import (
    burn_password_check,
    create_access_token,
    hash_password,
    hash_refresh_token,
    new_refresh_token,
    password_problems,
    verify_password,
)
from app.db.types import utcnow
from app.models import User, UserSession
from app.services import audit_service
from app.services.audit_service import RequestContext
from app.services.user_service import find_by_login, get_user_with_role

INVALID_LOGIN = "Invalid username or password, or the account is temporarily locked."
INVALID_SESSION = "Your session is invalid or has expired. Please sign in again."


@dataclass(frozen=True)
class IssuedTokens:
    user: User
    access_token: str
    expires_in: int
    refresh_token: str
    refresh_expires_at: datetime


def _check_login_rate(login: str, ctx: RequestContext) -> None:
    settings = get_settings()
    ip = ctx.ip_address or "unknown"
    for key, limit in (
        (f"login:{ip}:{login.strip().lower()}", settings.login_rate_limit_per_minute),
        (f"login-ip:{ip}", settings.login_ip_rate_limit_per_minute),
    ):
        retry_after = limiter.hit(key, limit, 60)
        if retry_after is not None:
            raise RateLimitedError(retry_after)


def _open_session(db: Session, user: User, ctx: RequestContext, family_id: str | None = None) -> IssuedTokens:
    settings = get_settings()
    raw_refresh = new_refresh_token()
    expires_at = utcnow() + timedelta(days=settings.refresh_token_days)
    session = UserSession(
        user_id=user.id,
        token_hash=hash_refresh_token(raw_refresh),
        family_id=family_id or str(uuid.uuid4()),
        expires_at=expires_at,
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent[:255] if ctx.user_agent else None,
    )
    db.add(session)
    db.flush()
    access_token, expires_in = create_access_token(user.id, session.id)
    return IssuedTokens(user, access_token, expires_in, raw_refresh, expires_at)


def login(db: Session, login_name: str, password: str, ctx: RequestContext) -> IssuedTokens:
    settings = get_settings()
    _check_login_rate(login_name, ctx)

    user = find_by_login(db, login_name)
    if user is None:
        burn_password_check(password)
        audit_service.record(
            db, "auth.login_failed", entity_type="user", after={"login": login_name[:100], "reason": "unknown_user"},
            ctx=ctx,
        )
        db.commit()
        raise AuthenticationError(INVALID_LOGIN, code="INVALID_CREDENTIALS")

    now = utcnow()
    if user.locked_until and user.locked_until > now:
        burn_password_check(password)
        audit_service.record(
            db, "auth.login_failed", entity_type="user", entity_id=user.id, after={"reason": "locked"}, ctx=ctx
        )
        db.commit()
        raise AuthenticationError(INVALID_LOGIN, code="INVALID_CREDENTIALS")

    valid, new_hash = verify_password(password, user.password_hash)
    if not valid:
        user.failed_login_count += 1
        reason = "bad_password"
        if user.failed_login_count >= settings.login_max_failures:
            user.locked_until = now + timedelta(minutes=settings.login_lockout_minutes)
            user.failed_login_count = 0
            reason = "locked_out"
            audit_service.record(
                db, "auth.lockout", entity_type="user", entity_id=user.id,
                after={"locked_until": user.locked_until.isoformat()}, ctx=ctx,
            )
        audit_service.record(
            db, "auth.login_failed", entity_type="user", entity_id=user.id, after={"reason": reason}, ctx=ctx
        )
        db.commit()
        raise AuthenticationError(INVALID_LOGIN, code="INVALID_CREDENTIALS")

    if not user.is_active:
        audit_service.record(
            db, "auth.login_failed", entity_type="user", entity_id=user.id, after={"reason": "inactive"}, ctx=ctx
        )
        db.commit()
        raise AuthenticationError(INVALID_LOGIN, code="INVALID_CREDENTIALS")

    if new_hash:
        user.password_hash = new_hash
    user.failed_login_count = 0
    user.locked_until = None
    user.last_login_at = now
    tokens = _open_session(db, user, ctx)
    audit_service.record(db, "auth.login", entity_type="user", entity_id=user.id, actor_user_id=user.id, ctx=ctx)
    db.commit()
    return tokens


def _revoke_family(db: Session, family_id: str) -> None:
    db.execute(
        update(UserSession)
        .where(UserSession.family_id == family_id, UserSession.revoked_at.is_(None))
        .values(revoked_at=utcnow())
    )


def refresh(db: Session, raw_refresh: str | None, ctx: RequestContext) -> IssuedTokens:
    if not raw_refresh:
        raise AuthenticationError(INVALID_SESSION, code="INVALID_SESSION")

    session = db.scalar(
        select(UserSession).where(UserSession.token_hash == hash_refresh_token(raw_refresh)).with_for_update()
    )
    if session is None:
        raise AuthenticationError(INVALID_SESSION, code="INVALID_SESSION")

    now = utcnow()
    if session.revoked_at is not None:
        # A rotated-out token was presented again: assume theft and end the whole family.
        _revoke_family(db, session.family_id)
        audit_service.record(
            db, "auth.refresh_reuse", entity_type="user", entity_id=session.user_id,
            after={"family_id": session.family_id}, ctx=ctx,
        )
        db.commit()
        raise AuthenticationError(INVALID_SESSION, code="INVALID_SESSION")

    user = get_user_with_role(db, session.user_id)
    if session.expires_at <= now or user is None or not user.is_active:
        session.revoked_at = now
        db.commit()
        raise AuthenticationError(INVALID_SESSION, code="INVALID_SESSION")

    session.revoked_at = now
    tokens = _open_session(db, user, ctx, family_id=session.family_id)
    db.commit()
    return tokens


def logout(db: Session, user: User, session_id: int, ctx: RequestContext) -> None:
    session = db.get(UserSession, session_id)
    if session is not None and session.revoked_at is None:
        session.revoked_at = utcnow()
    audit_service.record(db, "auth.logout", entity_type="user", entity_id=user.id, actor_user_id=user.id, ctx=ctx)
    db.commit()


def change_password(db: Session, user: User, current_password: str, new_password: str, ctx: RequestContext) -> None:
    valid, _ = verify_password(current_password, user.password_hash)
    if not valid:
        raise AppError("Current password is incorrect.", code="INVALID_CURRENT_PASSWORD", status_code=400)
    problems = password_problems(new_password, user.username)
    if current_password == new_password:
        problems.append("New password must be different from the current password.")
    if problems:
        raise AppError(
            "The new password does not meet the requirements.",
            code="WEAK_PASSWORD",
            status_code=422,
            details=[{"field": "new_password", "message": p} for p in problems],
        )

    now = utcnow()
    user.password_hash = hash_password(new_password)
    user.password_changed_at = now
    db.execute(
        update(UserSession)
        .where(UserSession.user_id == user.id, UserSession.revoked_at.is_(None))
        .values(revoked_at=now)
    )
    audit_service.record(
        db, "auth.password_changed", entity_type="user", entity_id=user.id, actor_user_id=user.id, ctx=ctx
    )
    db.commit()
