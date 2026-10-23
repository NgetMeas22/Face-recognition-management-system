"""Permission codes and the default role → permission matrix (docs/01-architecture.md §1.3)."""

from enum import StrEnum


class Perm(StrEnum):
    PEOPLE_READ = "people.read"
    PEOPLE_CONTACT_READ = "people.contact.read"
    PEOPLE_WRITE = "people.write"
    PEOPLE_ARCHIVE = "people.archive"
    PEOPLE_ERASE = "people.erase"
    CONSENT_MANAGE = "consent.manage"
    FACES_ENROLL = "faces.enroll"
    FACES_APPROVE = "faces.approve"
    FACES_DELETE = "faces.delete"
    SCAN_RUN = "scan.run"
    SCAN_REVIEW = "scan.review"
    ATTENDANCE_READ = "attendance.read"
    ATTENDANCE_WRITE = "attendance.write"
    ATTENDANCE_CORRECT = "attendance.correct"
    REPORTS_READ = "reports.read"
    REPORTS_EXPORT = "reports.export"
    USERS_MANAGE = "users.manage"
    ROLES_MANAGE = "roles.manage"
    AUDIT_READ = "audit.read"
    SETTINGS_MANAGE = "settings.manage"


PERMISSION_DESCRIPTIONS: dict[Perm, str] = {
    Perm.PEOPLE_READ: "View basic profile fields",
    Perm.PEOPLE_CONTACT_READ: "View email and phone",
    Perm.PEOPLE_WRITE: "Create, edit and deactivate people",
    Perm.PEOPLE_ARCHIVE: "Archive people",
    Perm.PEOPLE_ERASE: "Erase personal data",
    Perm.CONSENT_MANAGE: "Record and withdraw biometric consent",
    Perm.FACES_ENROLL: "Register face images",
    Perm.FACES_APPROVE: "Approve pending face templates",
    Perm.FACES_DELETE: "Delete face templates",
    Perm.SCAN_RUN: "Run face scans",
    Perm.SCAN_REVIEW: "Confirm or reject uncertain matches",
    Perm.ATTENDANCE_READ: "View attendance",
    Perm.ATTENDANCE_WRITE: "Record manual check-in/out",
    Perm.ATTENDANCE_CORRECT: "Void and correct attendance",
    Perm.REPORTS_READ: "View dashboard and reports",
    Perm.REPORTS_EXPORT: "Export reports",
    Perm.USERS_MANAGE: "Manage user accounts",
    Perm.ROLES_MANAGE: "Manage roles and permissions",
    Perm.AUDIT_READ: "View audit logs",
    Perm.SETTINGS_MANAGE: "Change system settings and retention",
}

HR_PERMISSIONS = frozenset(
    {
        Perm.PEOPLE_READ,
        Perm.PEOPLE_CONTACT_READ,
        Perm.PEOPLE_WRITE,
        Perm.CONSENT_MANAGE,
        Perm.FACES_ENROLL,
        Perm.FACES_APPROVE,
        Perm.FACES_DELETE,
        Perm.SCAN_RUN,
        Perm.SCAN_REVIEW,
        Perm.ATTENDANCE_READ,
        Perm.ATTENDANCE_WRITE,
        Perm.ATTENDANCE_CORRECT,
        Perm.REPORTS_READ,
        Perm.REPORTS_EXPORT,
    }
)

VIEWER_PERMISSIONS = frozenset({Perm.PEOPLE_READ, Perm.ATTENDANCE_READ, Perm.REPORTS_READ})

# name → (display name, description, permissions)
DEFAULT_ROLES: dict[str, tuple[str, str, frozenset[Perm]]] = {
    "admin": ("Administrator", "Full access to every feature", frozenset(Perm)),
    "hr": ("HR / Teacher", "Manages people, faces, scans and attendance", HR_PERMISSIONS),
    "viewer": ("Viewer", "Read-only access to profiles, attendance and reports", VIEWER_PERMISSIONS),
}
