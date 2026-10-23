from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session


def test_health_is_public_and_ok(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["app"] == "FaceTrack AI"


def test_ready_reports_database_and_migrations(client: TestClient) -> None:
    response = client.get("/api/v1/health/ready")
    assert response.status_code == 200, response.text
    body = response.json()
    assert body == {
        "status": "ok",
        "database": "ok",
        "migrations": "up_to_date",
        "current_revision": body["head_revision"],
        "head_revision": body["head_revision"],
    }
    assert body["head_revision"]


def test_ready_reports_pending_migrations(client: TestClient, db: Session) -> None:
    db.execute(text("UPDATE alembic_version SET version_num = 'outdated'"))  # rolled back after the test
    response = client.get("/api/v1/health/ready")
    assert response.status_code == 503
    assert response.json()["migrations"] == "pending"


def test_responses_carry_request_id_and_security_headers(client: TestClient) -> None:
    response = client.get("/api/v1/health", headers={"X-Request-ID": "abc12345-test"})
    assert response.headers["X-Request-ID"] == "abc12345-test"
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Cache-Control"] == "no-store"


def test_malformed_request_id_is_replaced(client: TestClient) -> None:
    response = client.get("/api/v1/health", headers={"X-Request-ID": "<script>"})
    assert response.headers["X-Request-ID"] != "<script>"
    assert len(response.headers["X-Request-ID"]) == 36
