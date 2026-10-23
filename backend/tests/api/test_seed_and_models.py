from datetime import UTC, date, datetime, timedelta

import pytest
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.permissions import Perm
from app.models import (
    AttendanceEventType,
    AttendanceMethod,
    AttendanceRecord,
    ConsentAction,
    ConsentMethod,
    ConsentRecord,
    ConsentType,
    Department,
    DepartmentKind,
    FaceSource,
    FaceTemplate,
    Permission,
    Person,
    PersonType,
    Role,
    SystemSetting,
)
from app.services import seed_service


def test_seed_is_idempotent(db: Session) -> None:
    report = seed_service.seed_core(db)
    assert report.created == []
    assert db.scalar(select(func.count()).select_from(Permission)) == len(Perm)
    admin = db.scalar(select(Role).where(Role.name == "admin"))
    assert admin.permission_codes == {p.value for p in Perm}
    assert db.get(SystemSetting, "recognition.accept_threshold").value == 0.50


def test_seed_restores_tampered_system_role_permissions(db: Session) -> None:
    viewer = db.scalar(select(Role).where(Role.name == "viewer"))
    viewer.permissions = []
    db.flush()
    seed_service.seed_core(db)
    assert viewer.permission_codes == {"people.read", "attendance.read", "reports.read"}


def _person(db: Session, code: str, **kw) -> Person:
    dept = Department(code=f"D-{code}", name="Dept", name_km="ព័ត៌មានវិទ្យា", kind=DepartmentKind.DEPARTMENT)
    person = Person(
        person_code=code, person_type=PersonType.EMPLOYEE, first_name="Sok", last_name="Dara",
        name_km="សុខ ដារា", department=dept, **kw,
    )
    db.add(person)
    db.flush()
    return person


def test_person_roundtrip_with_khmer_text_and_defaults(db: Session) -> None:
    person = _person(db, "EMP-2026-00001")
    db.expire_all()
    loaded = db.get(Person, person.id)
    assert loaded.name_km == "សុខ ដារា"
    assert loaded.department.name_km == "ព័ត៌មានវិទ្យា"
    assert loaded.status == "ACTIVE"
    assert loaded.created_at.tzinfo is UTC


def test_person_code_must_be_unique(db: Session) -> None:
    _person(db, "EMP-2026-00002")
    with pytest.raises(IntegrityError):
        _person(db, "EMP-2026-00002")


def test_deleting_person_cascades_biometrics_and_consent(db: Session, make_user) -> None:
    operator = make_user("hr")
    person = _person(db, "EMP-2026-00003")
    db.add_all(
        [
            ConsentRecord(
                person_id=person.id, consent_type=ConsentType.BIOMETRIC_FACE, action=ConsentAction.GRANTED,
                method=ConsentMethod.PAPER_FORM, notice_version="1.0", recorded_by=operator.id,
            ),
            FaceTemplate(
                person_id=person.id, embedding_ciphertext=b"\x00" * 540, key_id="k1", model_name="sface_2021dec",
                detector_name="yunet_2023mar", embedding_dim=128, quality_score=0.9, detection_score=0.95,
                source=FaceSource.UPLOAD, created_by=operator.id,
            ),
            AttendanceRecord(
                person_id=person.id, event_type=AttendanceEventType.CHECK_IN, occurred_at=datetime.now(UTC),
                attendance_date=date.today(), method=AttendanceMethod.MANUAL, recorded_by=operator.id,
            ),
        ]
    )
    db.flush()
    db.delete(person)
    db.flush()
    for model in (ConsentRecord, FaceTemplate, AttendanceRecord):
        assert db.scalar(select(func.count()).select_from(model).where(model.person_id == person.id)) == 0


def test_naive_datetimes_are_refused(db: Session, make_user) -> None:
    user = make_user("hr")
    user.locked_until = datetime.now() + timedelta(minutes=5)  # naive: ambiguous timezone
    with pytest.raises(Exception, match="timezone-aware"):
        db.flush()
