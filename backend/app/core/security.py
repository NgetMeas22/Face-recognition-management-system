"""Password hashing, password policy, JWT access tokens and opaque refresh tokens."""

import hashlib
import secrets
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher

from app.core.config import get_settings

_password_hash = PasswordHash((Argon2Hasher(),))

# Verified against when the username does not exist, so response time does not reveal
# whether an account exists.
_DUMMY_HASH = _password_hash.hash(secrets.token_urlsafe(16))

PASSWORD_MIN_LENGTH = 10
PASSWORD_MAX_LENGTH = 128
_COMMON_PASSWORDS = frozenset(
    {"password123", "1234567890", "qwertyuiop", "password1234", "admin12345", "letmein123", "iloveyou12"}
)


def hash_password(password: str) -> str:
    return _password_hash.hash(password)


def verify_password(password: str, password_hash: str) -> tuple[bool, str | None]:
    """Returns (is_valid, new_hash). new_hash is set when the stored hash should be upgraded."""
    return _password_hash.verify_and_update(password, password_hash)


def burn_password_check(password: str) -> None:
    _password_hash.verify(password, _DUMMY_HASH)


def password_problems(password: str, username: str | None = None) -> list[str]:
    problems: list[str] = []
    if len(password) < PASSWORD_MIN_LENGTH:
        problems.append(f"Password must be at least {PASSWORD_MIN_LENGTH} characters.")
    if len(password) > PASSWORD_MAX_LENGTH:
        problems.append(f"Password must be at most {PASSWORD_MAX_LENGTH} characters.")
    if len(set(password)) < 4:
        problems.append("Password is too repetitive.")
    if password.lower() in _COMMON_PASSWORDS:
        problems.append("Password is too common.")
    if username and username.lower() in password.lower():
        problems.append("Password must not contain the username.")
    return problems


@dataclass(frozen=True)
class AccessTokenClaims:
    user_id: int
    session_id: int
    issued_at: datetime


class TokenError(Exception):
    pass


def create_access_token(user_id: int, session_id: int, *, now: datetime | None = None) -> tuple[str, int]:
    settings = get_settings()
    now = now or datetime.now(UTC)
    expires_in = settings.access_token_minutes * 60
    payload = {
        "sub": str(user_id),
        "sid": session_id,
        "type": "access",
        "iss": settings.jwt_issuer,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=expires_in)).timestamp()),
        "jti": uuid.uuid4().hex,
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, expires_in


def decode_access_token(token: str) -> AccessTokenClaims:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            issuer=settings.jwt_issuer,
            options={"require": ["sub", "sid", "type", "iat", "exp"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise TokenError("Token has expired.") from exc
    except jwt.InvalidTokenError as exc:
        raise TokenError("Invalid token.") from exc
    if payload.get("type") != "access":
        raise TokenError("Invalid token type.")
    try:
        return AccessTokenClaims(
            user_id=int(payload["sub"]),
            session_id=int(payload["sid"]),
            issued_at=datetime.fromtimestamp(int(payload["iat"]), UTC),
        )
    except (TypeError, ValueError) as exc:
        raise TokenError("Invalid token claims.") from exc


def new_refresh_token() -> str:
    return secrets.token_urlsafe(32)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
