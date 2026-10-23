import type { Metadata } from "next";

import { RequirePermission } from "@/components/auth/require-permission";
import { ScansView } from "@/features/scans/scans-view";
import { Perm } from "@/lib/permissions";

export const metadata: Metadata = { title: "Scan History" };

export default function Page() {
  return (
    <RequirePermission requires={{ any: [Perm.SCAN_RUN, Perm.AUDIT_READ] }}>
      <ScansView />
    </RequirePermission>
  );
}
