"""Shared FastAPI dependencies: database session, request context, current user, permissions."""

from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.errors import AuthenticationError, PermissionDeniedError
from app.core.permissions import Perm
from app.core.security import TokenError, decode_access_token
from app.db.session import get_db
from app.models import User, UserSession
from app.services.audit_service import RequestContext
from app.services.user_service import get_user_with_role

# tokenUrl powers the "Authorize" button in /docs.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token", auto_error=False)

DbSession = Annotated[Session, Depends(get_db)]


def get_request_context(request: Request) -> RequestContext:
    return RequestContext(
        request_id=getattr(request.state, "request_id", None),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )


ReqCtx = Annotated[RequestContext, Depends(get_request_context)]


@dataclass(frozen=True)
class CurrentUser:
    user: User
    session_id: int
    permissions: frozenset[str]

    def has(self, *codes: str) -> bool:
        return all(code in self.permissions for code in codes)


def get_current_user(db: DbSession, token: Annotated[str | None, Depends(oauth2_scheme)]) -> CurrentUser:
    if not token:
        raise AuthenticationError()
    try:
        claims = decode_access_token(token)
    except TokenError as exc:
        raise AuthenticationError(str(exc), code="INVALID_TOKEN") from exc

    session = db.get(UserSession, claims.session_id)
    if session is None or session.revoked_at is not None or session.user_id != claims.user_id:
        raise AuthenticationError("Your session has ended. Please sign in again.", code="SESSION_REVOKED")

    user = get_user_with_role(db, claims.user_id)
    if user is None or not user.is_active:
        raise AuthenticationError("Account is not active.", code="INVALID_TOKEN")
    # Tokens issued before the last password change are rejected (iat has 1-second resolution).
    if claims.issued_at < user.password_changed_at.replace(microsecond=0):
        raise AuthenticationError("Your session has ended. Please sign in again.", code="SESSION_REVOKED")

    return CurrentUser(user=user, session_id=session.id, permissions=user.role.permission_codes)


AuthUser = Annotated[CurrentUser, Depends(get_current_user)]


def require_permission(*codes: Perm):
    """Dependency factory: `Depends(require_permission(Perm.USERS_MANAGE))`."""

    def checker(current: AuthUser) -> CurrentUser:
        if not current.has(*codes):
            raise PermissionDeniedError()
        return current

    return checker
