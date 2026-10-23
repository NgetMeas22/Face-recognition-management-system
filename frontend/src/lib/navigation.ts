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

/**
 * live     – fully backed by existing backend endpoints
 * partial  – the page works, but some actions wait for backend endpoints
 * planned  – the backend endpoints for this page do not exist yet
 */
export type Availability = "live" | "partial" | "planned";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  requires?: PermissionRequirement;
  availability: Availability;
  group: "Overview" | "People" | "Recognition" | "Attendance" | "System";
};

// Required permissions follow docs/01-architecture.md §1.5.
export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Overview", availability: "partial", requires: { all: [Perm.REPORTS_READ] } },
  { title: "Employees & Students", href: "/people", icon: Users, group: "People", availability: "planned", requires: { all: [Perm.PEOPLE_READ] } },
  { title: "Departments", href: "/departments", icon: Building2, group: "People", availability: "planned", requires: { all: [Perm.PEOPLE_READ] } },
  { title: "Face Registration", href: "/faces", icon: UserPlus, group: "Recognition", availability: "partial", requires: { all: [Perm.FACES_ENROLL] } },
  { title: "Face Scanner", href: "/scanner", icon: ScanFace, group: "Recognition", availability: "partial", requires: { all: [Perm.SCAN_RUN] } },
  { title: "Scan History", href: "/scans", icon: History, group: "Recognition", availability: "planned", requires: { any: [Perm.SCAN_RUN, Perm.AUDIT_READ] } },
  { title: "Attendance", href: "/attendance", icon: CalendarCheck, group: "Attendance", availability: "planned", requires: { all: [Perm.ATTENDANCE_READ] } },
  { title: "Reports", href: "/reports", icon: BarChart3, group: "Attendance", availability: "planned", requires: { all: [Perm.REPORTS_READ] } },
  { title: "Settings", href: "/settings", icon: Settings, group: "System", availability: "partial" },
];

export const NAV_GROUPS = ["Overview", "People", "Recognition", "Attendance", "System"] as const;

export function navItemFor(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}
