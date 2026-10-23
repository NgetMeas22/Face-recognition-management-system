// Mirrors backend/app/core/permissions.py. The backend enforces every permission; the frontend
// only uses these codes to hide controls a user could not use anyway.
export const Perm = {
  PEOPLE_READ: "people.read",
  PEOPLE_CONTACT_READ: "people.contact.read",
  PEOPLE_WRITE: "people.write",
  PEOPLE_ARCHIVE: "people.archive",
  PEOPLE_ERASE: "people.erase",
  CONSENT_MANAGE: "consent.manage",
  FACES_ENROLL: "faces.enroll",
  FACES_APPROVE: "faces.approve",
  FACES_DELETE: "faces.delete",
  SCAN_RUN: "scan.run",
  SCAN_REVIEW: "scan.review",
  ATTENDANCE_READ: "attendance.read",
  ATTENDANCE_WRITE: "attendance.write",
  ATTENDANCE_CORRECT: "attendance.correct",
  REPORTS_READ: "reports.read",
  REPORTS_EXPORT: "reports.export",
  USERS_MANAGE: "users.manage",
  ROLES_MANAGE: "roles.manage",
  AUDIT_READ: "audit.read",
  SETTINGS_MANAGE: "settings.manage",
} as const;

export type PermissionCode = (typeof Perm)[keyof typeof Perm];

/** A requirement is met when the user holds every code in `all` and at least one in `any`. */
export type PermissionRequirement = { all?: PermissionCode[]; any?: PermissionCode[] };

export function satisfies(granted: ReadonlySet<string>, requirement?: PermissionRequirement): boolean {
  if (!requirement) return true;
  const { all = [], any = [] } = requirement;
  return all.every((p) => granted.has(p)) && (any.length === 0 || any.some((p) => granted.has(p)));
}
