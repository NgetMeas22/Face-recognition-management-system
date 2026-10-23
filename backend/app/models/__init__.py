"""Import every model so Base.metadata is complete (used by Alembic and tests)."""

from app.models.attendance import AttendanceEventType, AttendanceMethod, AttendanceRecord, Punctuality
from app.models.audit_log import AuditLog
from app.models.consent import ConsentAction, ConsentMethod, ConsentRecord, ConsentType
from app.models.face_template import FaceSource, FaceTemplate, TemplateStatus
from app.models.person import Department, DepartmentKind, IdSequence, Person, PersonStatus, PersonType
from app.models.role import Permission, Role, role_permissions
from app.models.scan_event import LivenessResult, ReviewStatus, ScanEvent, ScanMode, ScanOutcome
from app.models.setting import DEFAULT_SETTINGS, SystemSetting
from app.models.user import User, UserSession

__all__ = [
    "DEFAULT_SETTINGS",
    "AttendanceEventType",
    "AttendanceMethod",
    "AttendanceRecord",
    "AuditLog",
    "ConsentAction",
    "ConsentMethod",
    "ConsentRecord",
    "ConsentType",
    "Department",
    "DepartmentKind",
    "FaceSource",
    "FaceTemplate",
    "IdSequence",
    "LivenessResult",
    "Permission",
    "Person",
    "PersonStatus",
    "PersonType",
    "Punctuality",
    "ReviewStatus",
    "Role",
    "ScanEvent",
    "ScanMode",
    "ScanOutcome",
    "SystemSetting",
    "TemplateStatus",
    "User",
    "UserSession",
    "role_permissions",
]
