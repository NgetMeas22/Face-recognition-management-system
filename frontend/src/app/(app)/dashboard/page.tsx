import type { Metadata } from "next";

import { RequirePermission } from "@/components/auth/require-permission";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import { Perm } from "@/lib/permissions";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <RequirePermission requires={{ all: [Perm.REPORTS_READ] }}>
      <DashboardView />
    </RequirePermission>
  );
}
