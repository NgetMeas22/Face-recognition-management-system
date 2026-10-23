from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app.core.config import get_settings
from app.core.rate_limit import SlidingWindowLimiter
from app.core.security import (
    TokenError,
    create_access_token,
    decode_access_token,
    hash_password,
    hash_refresh_token,
    new_refresh_token,
    password_problems,
    verify_password,
)
from app.services.audit_service import redact


def test_password_hash_roundtrip() -> None:
    hashed = hash_password("Correct-Horse-42")
    assert hashed.startswith("$argon2id$")
    assert verify_password("Correct-Horse-42", hashed)[0] is True
    assert verify_password("correct-horse-42", hashed)[0] is False


@pytest.mark.parametrize(
    "password, username, fragment",
    [
        ("short", None, "at least 10"),
        ("aaaaaaaaaaaa", None, "repetitive"),
        ("password123", None, "common"),
        ("my-alice-password", "alice", "username"),
        ("x" * 129 + "abcd", None, "at most"),
    ],
)
def test_password_policy_rejects(password: str, username: str | None, fragment: str) -> None:
    assert any(fragment in p for p in password_problems(password, username))


def test_password_policy_accepts_reasonable_password() -> None:
    assert password_problems("Mekong-River-2026", "alice") == []


def test_access_token_roundtrip() -> None:
    token, expires_in = create_access_token(7, 99)
    claims = decode_access_token(token)
    assert (claims.user_id, claims.session_id) == (7, 99)
    assert expires_in == get_settings().access_token_minutes * 60


def test_expired_token_is_rejected() -> None:
    token, _ = create_access_token(1, 1, now=datetime.now(UTC) - timedelta(hours=1))
    with pytest.raises(TokenError, match="expired"):
        decode_access_token(token)


def test_tampered_or_foreign_tokens_are_rejected() -> None:
    settings = get_settings()
    token, _ = create_access_token(1, 1)
    with pytest.raises(TokenError):
        decode_access_token(token[:-2] + ("AA" if not token.endswith("AA") else "BB"))

    now = int(datetime.now(UTC).timestamp())
    base = {"sub": "1", "sid": 1, "iat": now, "exp": now + 60, "iss": settings.jwt_issuer}
    wrong_key = jwt.encode({**base, "type": "access"}, "x" * 40, algorithm="HS256")
    refresh_type = jwt.encode({**base, "type": "refresh"}, settings.jwt_secret, algorithm="HS256")
    unsigned = jwt.encode({**base, "type": "access"}, None, algorithm="none")
    for bad in (wrong_key, refresh_type, unsigned):
        with pytest.raises(TokenError):
            decode_access_token(bad)


def test_refresh_tokens_are_random_and_hashed() -> None:
    a, b = new_refresh_token(), new_refresh_token()
    assert a != b and len(a) >= 40
    assert len(hash_refresh_token(a)) == 64
    assert hash_refresh_token(a) == hash_refresh_token(a)


def test_rate_limiter_sliding_window() -> None:
    now = [0.0]
    limiter = SlidingWindowLimiter(clock=lambda: now[0])
    assert [limiter.hit("k", 2, 60) for _ in range(2)] == [None, None]
    assert limiter.hit("k", 2, 60) == 60
    assert limiter.hit("other", 2, 60) is None
    now[0] = 61
    assert limiter.hit("k", 2, 60) is None


def test_audit_redaction() -> None:
    data = {"username": "a", "password": "x", "nested": {"refresh_token": "y", "ok": 1}, "embedding": [1, 2]}
    assert redact(data) == {
        "username": "a",
        "password": "[REDACTED]",
        "nested": {"refresh_token": "[REDACTED]", "ok": 1},
        "embedding": "[REDACTED]",
    }
