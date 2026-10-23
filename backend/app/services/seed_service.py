"""Idempotent seeding of roles, permissions, settings and demo departments."""

from dataclasses import dataclass, field

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.permissions import DEFAULT_ROLES, PERMISSION_DESCRIPTIONS
from app.models import DEFAULT_SETTINGS, Department, DepartmentKind, Permission, Role, SystemSetting

DEMO_DEPARTMENTS = [
    ("IT", "Information Technology", "ព័ត៌មានវិទ្យា", DepartmentKind.DEPARTMENT),
    ("HR", "Human Resources", "ធនធានមនុស្ស", DepartmentKind.DEPARTMENT),
    ("FIN", "Finance", "ហិរញ្ញវត្ថុ", DepartmentKind.DEPARTMENT),
    ("G12-A", "Grade 12-A", "ថ្នាក់ទី១២ក", DepartmentKind.CLASS),
    ("G12-B", "Grade 12-B", "ថ្នាក់ទី១២ខ", DepartmentKind.CLASS),
]


@dataclass
class SeedReport:
    created: list[str] = field(default_factory=list)

    def add(self, what: str) -> None:
        self.created.append(what)


def seed_core(db: Session, report: SeedReport | None = None) -> SeedReport:
    """Creates missing permissions/roles/settings and syncs system-role permissions to the defaults."""
    report = report or SeedReport()

    existing_perms = {p.code: p for p in db.scalars(select(Permission))}
    for perm, description in PERMISSION_DESCRIPTIONS.items():
        if perm.value not in existing_perms:
            existing_perms[perm.value] = Permission(code=perm.value, description=description)
            db.add(existing_perms[perm.value])
            report.add(f"permission {perm.value}")
    db.flush()

    roles = {r.name: r for r in db.scalars(select(Role).options(selectinload(Role.permissions)))}
    for name, (display_name, description, perms) in DEFAULT_ROLES.items():
        role = roles.get(name)
        if role is None:
            role = Role(name=name, display_name=display_name, description=description, is_system=True)
            db.add(role)
            report.add(f"role {name}")
        role.permissions = [existing_perms[p.value] for p in sorted(perms)]
    db.flush()

    existing_settings = set(db.scalars(select(SystemSetting.key)))
    for key, value in DEFAULT_SETTINGS.items():
        if key not in existing_settings:
            db.add(SystemSetting(key=key, value=value))
            report.add(f"setting {key}")
    db.flush()
    return report


def seed_demo_departments(db: Session, report: SeedReport | None = None) -> SeedReport:
    report = report or SeedReport()
    existing = set(db.scalars(select(Department.code)))
    for code, name, name_km, kind in DEMO_DEPARTMENTS:
        if code not in existing:
            db.add(Department(code=code, name=name, name_km=name_km, kind=kind))
            report.add(f"department {code}")
    db.flush()
    return report
