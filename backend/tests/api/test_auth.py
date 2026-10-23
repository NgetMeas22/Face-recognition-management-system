from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token
from app.models import AuditLog, UserSession
from tests.conftest import TEST_PASSWORD, auth_header, login

XHR = {"X-Requested-With": "XMLHttpRequest"}


def audit_actions(db: Session) -> list[str]:
    return list(db.scalars(select(AuditLog.action).order_by(AuditLog.id)))


# ---- login ---------------------------------------------------------------


def test_login_returns_token_user_and_refresh_cookie(client: TestClient, make_user, db: Session) -> None:
    user = make_user("hr", username="hr.alice")
    response = client.post("/api/v1/auth/login", json={"username": "HR.Alice", "password": TEST_PASSWORD})

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["expires_in"] == get_settings().access_token_minutes * 60
    assert body["user"]["username"] == "hr.alice"
    assert body["user"]["role"]["name"] == "hr"
    assert "people.write" in body["user"]["permissions"]
    assert "users.manage" not in body["user"]["permissions"]

    cookie = response.headers["set-cookie"]
    assert "ft_refresh=" in cookie
    assert "HttpOnly" in cookie
    assert "Path=/api/v1/auth" in cookie
    assert "SameSite=strict" in cookie

    db.refresh(user)
    assert user.last_login_at is not None
    assert audit_actions(db)[-1] == "auth.login"


def test_login_by_email(client: TestClient, make_user) -> None:
    make_user("viewer", username="bob", email="Bob@Example.com")
    assert login(client, "bob@example.com")["user"]["username"] == "bob"


def test_token_endpoint_accepts_oauth2_form(client: TestClient, make_user) -> None:
    make_user("admin", username="swagger")
    response = client.post("/api/v1/auth/token", data={"username": "swagger", "password": TEST_PASSWORD})
    assert response.status_code == 200
    assert response.json()["access_token"]


@pytest.mark.parametrize("username, password", [("carol", "wrong-password"), ("nobody", TEST_PASSWORD)])
def test_bad_credentials_get_the_same_generic_error(client: TestClient, make_user, username, password) -> None:
    make_user("hr", username="carol")
    response = client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert response.status_code == 401
    error = response.json()["error"]
    assert error["code"] == "INVALID_CREDENTIALS"
    assert error["message"].startswith("Invalid username or password")


def test_failed_logins_are_audited(client: TestClient, make_user, db: Session) -> None:
    make_user("hr", username="dave")
    client.post("/api/v1/auth/login", json={"username": "dave", "password": "nope-nope-nope"})
    client.post("/api/v1/auth/login", json={"username": "ghost", "password": "nope-nope-nope"})
    rows = db.scalars(select(AuditLog).where(AuditLog.action == "auth.login_failed")).all()
    assert [r.after_data["reason"] for r in rows] == ["bad_password", "unknown_user"]
    assert all(r.request_id for r in rows)


def test_inactive_user_cannot_log_in(client: TestClient, make_user) -> None:
    make_user("hr", username="erin", is_active=False)
    response = client.post("/api/v1/auth/login", json={"username": "erin", "password": TEST_PASSWORD})
    assert response.status_code == 401


def test_account_locks_after_repeated_failures(
    client: TestClient, make_user, db: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "login_rate_limit_per_minute", 100)
    monkeypatch.setattr(settings, "login_max_failures", 3)
    user = make_user("hr", username="frank")

    for _ in range(3):
        client.post("/api/v1/auth/login", json={"username": "frank", "password": "bad-password-1"})
    db.refresh(user)
    assert user.locked_until is not None

    # Even the correct password is refused while locked, with the same generic message.
    response = client.post("/api/v1/auth/login", json={"username": "frank", "password": TEST_PASSWORD})
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"
    assert "auth.lockout" in audit_actions(db)

    # After the lockout expires, the correct password works again.
    user.locked_until = datetime.now(UTC) - timedelta(seconds=1)
    db.commit()
    assert login(client, "frank")["user"]["username"] == "frank"


def test_login_is_rate_limited(client: TestClient, make_user) -> None:
    make_user("hr", username="gina")
    limit = get_settings().login_rate_limit_per_minute
    for _ in range(limit):
        client.post("/api/v1/auth/login", json={"username": "gina", "password": "bad-password-1"})
    response = client.post("/api/v1/auth/login", json={"username": "gina", "password": TEST_PASSWORD})
    assert response.status_code == 429
    assert response.json()["error"]["code"] == "RATE_LIMITED"
    assert int(response.headers["Retry-After"]) >= 1


# ---- access tokens -------------------------------------------------------


def test_me_requires_a_token(client: TestClient) -> None:
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"
    assert response.json()["error"]["code"] == "NOT_AUTHENTICATED"


@pytest.mark.parametrize("token", ["garbage", "a.b.c"])
def test_me_rejects_malformed_tokens(client: TestClient, token: str) -> None:
    response = client.get("/api/v1/auth/me", headers=auth_header(token))
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_TOKEN"


def test_me_rejects_expired_token(client: TestClient, make_user, db: Session) -> None:
    make_user("hr", username="henry")
    login(client, "henry")
    session = db.scalars(select(UserSession).order_by(UserSession.id.desc())).first()
    old = datetime.now(UTC) - timedelta(hours=2)
    token, _ = create_access_token(session.user_id, session.id, now=old)
    response = client.get("/api/v1/auth/me", headers=auth_header(token))
    assert response.status_code == 401
    assert response.json()["error"]["message"] == "Token has expired."


def test_me_returns_profile_and_permissions(client: TestClient, make_user) -> None:
    make_user("viewer", username="ivy")
    token = login(client, "ivy")["access_token"]
    body = client.get("/api/v1/auth/me", headers=auth_header(token)).json()
    assert body["username"] == "ivy"
    assert body["permissions"] == ["attendance.read", "people.read", "reports.read"]
    assert "password_hash" not in body


def test_deactivated_user_token_stops_working(client: TestClient, make_user, db: Session) -> None:
    user = make_user("hr", username="jack")
    token = login(client, "jack")["access_token"]
    user.is_active = False
    db.commit()
    assert client.get("/api/v1/auth/me", headers=auth_header(token)).status_code == 401


# ---- role-based access ---------------------------------------------------


@pytest.mark.parametrize("role, expected", [("admin", 200), ("hr", 403), ("viewer", 403)])
def test_roles_endpoint_requires_roles_manage(client: TestClient, make_user, role: str, expected: int) -> None:
    make_user(role, username=f"rbac-{role}")
    token = login(client, f"rbac-{role}")["access_token"]
    response = client.get("/api/v1/roles", headers=auth_header(token))
    assert response.status_code == expected
    if expected == 200:
        names = [r["name"] for r in response.json()]
        assert names == ["admin", "hr", "viewer"]
    else:
        assert response.json()["error"]["code"] == "PERMISSION_DENIED"


# ---- refresh / logout ----------------------------------------------------


def test_refresh_requires_csrf_header(client: TestClient, make_user) -> None:
    make_user("hr", username="kate")
    login(client, "kate")
    response = client.post("/api/v1/auth/refresh")
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "CSRF_CHECK_FAILED"


def test_refresh_without_cookie_is_rejected(client: TestClient) -> None:
    response = client.post("/api/v1/auth/refresh", headers=XHR)
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_SESSION"


def test_refresh_rotates_token_and_detects_reuse(client: TestClient, make_user, db: Session) -> None:
    make_user("hr", username="liam")
    old_access = login(client, "liam")["access_token"]
    first_cookie = client.cookies["ft_refresh"]

    response = client.post("/api/v1/auth/refresh", headers=XHR)
    assert response.status_code == 200, response.text
    new_access = response.json()["access_token"]
    second_cookie = client.cookies["ft_refresh"]
    assert second_cookie != first_cookie
    assert client.get("/api/v1/auth/me", headers=auth_header(new_access)).status_code == 200
    # Requests already in flight with the previous access token must not fail mid-refresh.
    assert client.get("/api/v1/auth/me", headers=auth_header(old_access)).status_code == 200

    # Replaying the rotated-out token revokes the whole session family...
    client.cookies.clear()
    client.cookies.set("ft_refresh", first_cookie, path="/api/v1/auth")
    assert client.post("/api/v1/auth/refresh", headers=XHR).status_code == 401

    # ...so the newer refresh token and its access token are dead too.
    client.cookies.clear()
    client.cookies.set("ft_refresh", second_cookie, path="/api/v1/auth")
    assert client.post("/api/v1/auth/refresh", headers=XHR).status_code == 401
    for token in (old_access, new_access):
        assert client.get("/api/v1/auth/me", headers=auth_header(token)).status_code == 401
    assert "auth.refresh_reuse" in audit_actions(db)


def test_logout_after_refresh_ends_every_token_of_that_sign_in(client: TestClient, make_user) -> None:
    make_user("hr", username="lucy")
    old_access = login(client, "lucy")["access_token"]
    new_access = client.post("/api/v1/auth/refresh", headers=XHR).json()["access_token"]

    assert client.post("/api/v1/auth/logout", headers=auth_header(old_access)).status_code == 204
    for token in (old_access, new_access):
        assert client.get("/api/v1/auth/me", headers=auth_header(token)).status_code == 401
    assert client.post("/api/v1/auth/refresh", headers=XHR).status_code == 401


def test_logout_only_ends_the_current_sign_in(client: TestClient, make_user) -> None:
    make_user("hr", username="leo")
    laptop = login(client, "leo")["access_token"]
    phone = login(client, "leo")["access_token"]
    assert client.post("/api/v1/auth/logout", headers=auth_header(laptop)).status_code == 204
    assert client.get("/api/v1/auth/me", headers=auth_header(phone)).status_code == 200


def test_expired_refresh_token_is_rejected(client: TestClient, make_user, db: Session) -> None:
    make_user("hr", username="mia")
    login(client, "mia")
    session = db.scalars(select(UserSession).order_by(UserSession.id.desc())).first()
    session.expires_at = datetime.now(UTC) - timedelta(minutes=1)
    db.commit()
    assert client.post("/api/v1/auth/refresh", headers=XHR).status_code == 401


def test_logout_revokes_session_immediately(client: TestClient, make_user, db: Session) -> None:
    make_user("hr", username="noah")
    token = login(client, "noah")["access_token"]

    response = client.post("/api/v1/auth/logout", headers=auth_header(token))
    assert response.status_code == 204
    assert 'ft_refresh=""' in response.headers["set-cookie"] or "Max-Age=0" in response.headers["set-cookie"]

    assert client.get("/api/v1/auth/me", headers=auth_header(token)).status_code == 401
    assert "auth.logout" in audit_actions(db)


# ---- change password -----------------------------------------------------


def test_change_password_revokes_all_sessions(client: TestClient, make_user) -> None:
    make_user("hr", username="olivia")
    token_a = login(client, "olivia")["access_token"]
    token_b = login(client, "olivia")["access_token"]

    response = client.post(
        "/api/v1/auth/change-password",
        headers=auth_header(token_a),
        json={"current_password": TEST_PASSWORD, "new_password": "Brand-New-Secret-7"},
    )
    assert response.status_code == 204, response.text

    for token in (token_a, token_b):
        assert client.get("/api/v1/auth/me", headers=auth_header(token)).status_code == 401
    assert client.post("/api/v1/auth/login", json={"username": "olivia", "password": TEST_PASSWORD}).status_code == 401
    assert login(client, "olivia", "Brand-New-Secret-7")["user"]["username"] == "olivia"


def test_change_password_rejects_wrong_current_password(client: TestClient, make_user) -> None:
    make_user("hr", username="paul")
    token = login(client, "paul")["access_token"]
    response = client.post(
        "/api/v1/auth/change-password",
        headers=auth_header(token),
        json={"current_password": "not-my-password", "new_password": "Brand-New-Secret-7"},
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_CURRENT_PASSWORD"


def test_change_password_enforces_policy(client: TestClient, make_user) -> None:
    make_user("hr", username="quinn")
    token = login(client, "quinn")["access_token"]
    response = client.post(
        "/api/v1/auth/change-password",
        headers=auth_header(token),
        json={"current_password": TEST_PASSWORD, "new_password": "quinn12345678"},
    )
    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "WEAK_PASSWORD"
    assert any("username" in d["message"] for d in error["details"])
