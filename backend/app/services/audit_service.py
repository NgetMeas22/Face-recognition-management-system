"""Writes rows to the append-only audit log."""

from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session

from app.models import AuditLog

_REDACTED = "[REDACTED]"
_SENSITIVE_KEYS = ("password", "token", "secret", "embedding", "hash", "key")


@dataclass(frozen=True)
class RequestContext:
    request_id: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None


def redact(data: dict[str, Any] | None) -> dict[str, Any] | None:
    if data is None:
        return None
    clean: dict[str, Any] = {}
    for key, value in data.items():
        if any(s in key.lower() for s in _SENSITIVE_KEYS):
            clean[key] = _REDACTED
        elif isinstance(value, dict):
            clean[key] = redact(value)
        else:
            clean[key] = value
    return clean


def record(
    db: Session,
    action: str,
    *,
    entity_type: str,
    entity_id: int | str | None = None,
    actor_user_id: int | None = None,
    before: dict[str, Any] | None = None,
    after: dict[str, Any] | None = None,
    reason: str | None = None,
    ctx: RequestContext | None = None,
) -> AuditLog:
    """Adds an audit row to the session. The caller commits it with the change it describes."""
    ctx = ctx or RequestContext()
    entry = AuditLog(
        actor_user_id=actor_user_id,
        action=action,
        entity_type=entity_type,
        entity_id=None if entity_id is None else str(entity_id),
        before_data=redact(before),
        after_data=redact(after),
        reason=reason,
        request_id=ctx.request_id,
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent[:255] if ctx.user_agent else None,
    )
    db.add(entry)
    return entry
