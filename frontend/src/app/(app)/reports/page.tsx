import type { Metadata } from "next";

import { RequirePermission } from "@/components/auth/require-permission";
import { ReportsView } from "@/features/reports/reports-view";
import { Perm } from "@/lib/permissions";

export const metadata: Metadata = { title: "Reports" };

export default function Page() {
  return (
    <RequirePermission requires={{ all: [Perm.REPORTS_READ] }}>
      <ReportsView />
    </RequirePermission>
  );
}
