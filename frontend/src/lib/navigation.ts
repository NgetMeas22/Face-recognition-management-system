import {
  BarChart3,
  Building2,
  CalendarCheck,
  History,
  LayoutDashboard,
  type LucideIcon,
  ScanFace,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";

import { Perm, type PermissionRequirement } from "./permissions";
import { stripLocale } from "./i18n/routing";
import type { Translations } from "./i18n/translations";

/**
 * live     – fully backed by existing backend endpoints
 * partial  – the page works, but some actions wait for backend endpoints
 * planned  – the backend endpoints for this page do not exist yet
 */
export type Availability = "live" | "partial" | "planned";

export type NavItem = {
  title: string;
  titleKey: keyof Translations["nav"];
  href: string;
  icon: LucideIcon;
  requires?: PermissionRequirement;
  availability: Availability;
  group: "Overview" | "People" | "Recognition" | "Attendance" | "System";
  groupKey: keyof Translations["nav"];
};

// Required permissions follow docs/01-architecture.md §1.5.
export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", titleKey: "dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Overview", groupKey: "overview", availability: "partial", requires: { all: [Perm.REPORTS_READ] } },
  { title: "Employees", titleKey: "employees", href: "/people", icon: Users, group: "People", groupKey: "people", availability: "planned", requires: { all: [Perm.PEOPLE_READ] } },
  { title: "Departments", titleKey: "departments", href: "/departments", icon: Building2, group: "People", groupKey: "people", availability: "planned", requires: { all: [Perm.PEOPLE_READ] } },
  { title: "Face Registration", titleKey: "faces", href: "/faces", icon: UserPlus, group: "Recognition", groupKey: "recognition", availability: "partial", requires: { all: [Perm.FACES_ENROLL] } },
  { title: "Face Scanner", titleKey: "scanner", href: "/scanner", icon: ScanFace, group: "Recognition", groupKey: "recognition", availability: "partial", requires: { all: [Perm.SCAN_RUN] } },
  { title: "Scan History", titleKey: "scans", href: "/scans", icon: History, group: "Recognition", groupKey: "recognition", availability: "planned", requires: { any: [Perm.SCAN_RUN, Perm.AUDIT_READ] } },
  { title: "Attendance", titleKey: "attendance", href: "/attendance", icon: CalendarCheck, group: "Attendance", groupKey: "attendance", availability: "planned", requires: { all: [Perm.ATTENDANCE_READ] } },
  { title: "Reports", titleKey: "reports", href: "/reports", icon: BarChart3, group: "Attendance", groupKey: "attendance", availability: "planned", requires: { all: [Perm.REPORTS_READ] } },
  { title: "Settings", titleKey: "settings", href: "/settings", icon: Settings, group: "System", groupKey: "system", availability: "partial" },
];

export const NAV_GROUPS = [
  { name: "Overview", key: "overview" },
  { name: "People", key: "people" },
  { name: "Recognition", key: "recognition" },
  { name: "Attendance", key: "attendance" },
  { name: "System", key: "system" },
] as const;

/** Matches a pathname, with or without its /en or /km prefix, to its sidebar item. */
export function navItemFor(pathname: string): NavItem | undefined {
  pathname = stripLocale(pathname).path;
  return NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}
