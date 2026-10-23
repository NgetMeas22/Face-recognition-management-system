"""PostgreSQL-specific behaviour: constraints, timestamptz, JSONB, identity columns, encoding."""

from datetime import UTC, date, datetime

import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import (
    AttendanceEventType,
    AttendanceMethod,
    AttendanceRecord,
    AuditLog,
    Department,
    DepartmentKind,
    Person,
    PersonType,
    Punctuality,
    User,
)
from app.services import audit_service


def expect_violation(db: Session, constraint: str, statement, params: dict | None = None) -> None:
    """Runs `statement` in a savepoint and asserts it is rejected by the named constraint."""
    with pytest.raises(IntegrityError) as exc:
        with db.begin_nested():
            if isinstance(statement, str):
                db.execute(text(statement), params or {})
            else:
                db.add(statement)
                db.flush()
    assert constraint in str(exc.value)


def test_database_is_postgresql_utf8(db: Session) -> None:
    version = db.execute(text("SHOW server_version_num")).scalar_one()
    assert int(version) >= 150000
    assert db.execute(text("SHOW server_encoding")).scalar_one() == "UTF8"


def test_check_constraints_enforce_domain_rules(db: Session, make_user) -> None:
    operator = make_user("hr")
    dept = Department(code="QA", name="QA", kind=DepartmentKind.DEPARTMENT)
    person = Person(person_code="EMP-2026-09001", person_type=PersonType.EMPLOYEE, first_name="A", last_name="B", department=dept)
    db.add(person)
    db.flush()

    # Enum columns are VARCHAR + CHECK: values outside the enum are refused by the database too.
    expect_violation(db, "ck_departments_department_kind", "INSERT INTO departments (code, name, kind) VALUES ('X', 'X', 'TEAM')")
    # Usernames/emails must be stored lowercase (PostgreSQL text comparison is case-sensitive).
    expect_violation(
        db,
        "ck_users_username_lowercase",
        "INSERT INTO users (username, email, full_name, password_hash, role_id) VALUES ('Admin2', 'a2@x.test', 'A', 'h', :role)",
        {"role": operator.role_id},
    )
    expect_violation(db, "ck_people_archived_at_matches_status", "UPDATE people SET status = 'ARCHIVED' WHERE id = :id", {"id": person.id})

    now = datetime.now(UTC)
    base = dict(person_id=person.id, occurred_at=now, attendance_date=date.today(), method=AttendanceMethod.MANUAL, recorded_by=operator.id)
    expect_violation(
        db,
        "ck_attendance_records_punctuality_only_on_check_in",
        AttendanceRecord(event_type=AttendanceEventType.CHECK_OUT, punctuality=Punctuality.LATE, **base),
    )
    expect_violation(
        db,
        "ck_attendance_records_void_requires_reason",
        AttendanceRecord(event_type=AttendanceEventType.CHECK_IN, is_voided=True, **base),
    )


def test_case_insensitive_login_lookup_still_works(db: Session, make_user) -> None:
    from app.services.user_service import find_by_login

    make_user("viewer", username="sok.dara", email="Sok.Dara@Example.COM")
    assert find_by_login(db, "SOK.DARA").username == "sok.dara"
    assert find_by_login(db, " sok.dara@example.com ").username == "sok.dara"


def test_timestamptz_roundtrips_as_utc_regardless_of_session_timezone(db: Session, make_user) -> None:
    user = make_user("hr")
    instant = datetime(2026, 10, 23, 1, 30, 15, 123456, tzinfo=UTC)
    user.last_login_at = instant
    db.flush()

    db.execute(text("SET LOCAL TIME ZONE 'Asia/Phnom_Penh'"))
    db.expire_all()
    loaded = db.get(User, user.id)
    assert loaded.last_login_at == instant
    assert loaded.last_login_at.tzinfo is UTC
    # Server default now() fills created_at as an aware timestamp too.
    assert loaded.created_at.tzinfo is UTC
    assert db.execute(text("SELECT pg_typeof(last_login_at)::text FROM users WHERE id = :id"), {"id": user.id}).scalar_one() == "timestamp with time zone"


def test_audit_payload_is_queryable_jsonb(db: Session) -> None:
    audit_service.record(db, "test.jsonb", entity_type="test", after={"reason": "bad_password", "nested": {"n": 1}})
    db.flush()
    found = db.scalars(select(AuditLog).where(AuditLog.after_data["reason"].astext == "bad_password")).all()
    assert [r.action for r in found] == ["test.jsonb"]
    assert db.execute(text("SELECT pg_typeof(after_data)::text FROM audit_logs LIMIT 1")).scalar_one() == "jsonb"


def test_primary_keys_are_identity_columns(db: Session) -> None:
    rows = db.execute(
        text(
            "SELECT table_name FROM information_schema.columns "
            "WHERE table_schema = 'public' AND column_name = 'id' AND is_identity = 'YES'"
        )
    ).scalars()
    assert set(rows) >= {"users", "people", "face_templates", "attendance_records", "scan_events", "audit_logs"}


def test_foreign_keys_that_cascade_are_indexed(db: Session) -> None:
    """PostgreSQL does not index FK columns automatically; cascades/lookups on these need one."""
    unindexed = set(
        db.execute(
            text(
                """
                SELECT c.conrelid::regclass::text || '.' || a.attname
                FROM pg_constraint c
                JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
                WHERE c.contype = 'f' AND c.confrelid::regclass::text <> 'users'
                  AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid = c.conrelid AND i.indkey[0] = c.conkey[1])
                """
            )
        ).scalars()
    )
    assert unindexed == set()
