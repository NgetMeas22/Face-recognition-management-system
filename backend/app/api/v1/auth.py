from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, Header, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import AuthUser, DbSession, ReqCtx
from app.core.config import get_settings
from app.core.errors import AppError
from app.models import User
from app.schemas.auth import ChangePasswordRequest, LoginRequest, MeOut, RoleOut, TokenOut
from app.schemas.common import error_responses
from app.services import auth_service
from app.services.auth_service import IssuedTokens

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE_NAME = "ft_refresh"
REFRESH_COOKIE_PATH = "/api/v1/auth"


def me_out(user: User) -> MeOut:
    return MeOut(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=RoleOut.model_validate(user.role),
        permissions=sorted(user.role.permission_codes),
        last_login_at=user.last_login_at,
    )


def _set_refresh_cookie(response: Response, tokens: IssuedTokens) -> None:
    settings = get_settings()
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=tokens.refresh_token,
        max_age=settings.refresh_token_days * 86400,
        path=REFRESH_COOKIE_PATH,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="strict",
    )


def _clear_refresh_cookie(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path=REFRESH_COOKIE_PATH,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="strict",
    )


def _token_out(response: Response, tokens: IssuedTokens) -> TokenOut:
    _set_refresh_cookie(response, tokens)
    return TokenOut(access_token=tokens.access_token, expires_in=tokens.expires_in, user=me_out(tokens.user))


@router.post("/login", response_model=TokenOut, responses=error_responses(401, 422, 429))
def login(body: LoginRequest, response: Response, db: DbSession, ctx: ReqCtx) -> TokenOut:
    """Sign in with username (or email) and password. Sets the HttpOnly refresh cookie."""
    return _token_out(response, auth_service.login(db, body.username, body.password, ctx))


@router.post("/token", response_model=TokenOut, responses=error_responses(401, 422, 429))
def token(
    form: Annotated[OAuth2PasswordRequestForm, Depends()], response: Response, db: DbSession, ctx: ReqCtx
) -> TokenOut:
    """OAuth2 password-flow form endpoint, used by the **Authorize** button in /docs."""
    return _token_out(response, auth_service.login(db, form.username, form.password, ctx))


@router.post("/refresh", response_model=TokenOut, responses=error_responses(401, 403))
def refresh(
    response: Response,
    db: DbSession,
    ctx: ReqCtx,
    x_requested_with: Annotated[str | None, Header(description="Must be `XMLHttpRequest` (CSRF guard)")] = None,
    refresh_cookie: Annotated[str | None, Cookie(alias=REFRESH_COOKIE_NAME, include_in_schema=False)] = None,
) -> TokenOut:
    """Exchange the refresh cookie for a new access token. The refresh token is rotated."""
    if x_requested_with != "XMLHttpRequest":
        raise AppError("Missing X-Requested-With header.", code="CSRF_CHECK_FAILED", status_code=403)
    try:
        tokens = auth_service.refresh(db, refresh_cookie, ctx)
    except AppError:
        _clear_refresh_cookie(response)
        raise
    return _token_out(response, tokens)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, responses=error_responses(401))
def logout(current: AuthUser, db: DbSession, ctx: ReqCtx, response: Response) -> Response:
    """Revoke the current session. The access token stops working immediately."""
    auth_service.logout(db, current.user, current.session_id, ctx)
    response.status_code = status.HTTP_204_NO_CONTENT
    _clear_refresh_cookie(response)
    return response


@router.get("/me", response_model=MeOut, responses=error_responses(401))
def me(current: AuthUser) -> MeOut:
    """The signed-in user, role and effective permissions."""
    return me_out(current.user)


@router.post(
    "/change-password", status_code=status.HTTP_204_NO_CONTENT, responses=error_responses(400, 401, 422)
)
def change_password(
    body: ChangePasswordRequest, current: AuthUser, db: DbSession, ctx: ReqCtx, response: Response
) -> Response:
    """Change your password. All of your sessions are signed out; sign in again afterwards."""
    auth_service.change_password(db, current.user, body.current_password, body.new_password, ctx)
    response.status_code = status.HTTP_204_NO_CONTENT
    _clear_refresh_cookie(response)
    return response
