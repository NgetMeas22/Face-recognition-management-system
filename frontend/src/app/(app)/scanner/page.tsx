import type { Metadata } from "next";

import { RequirePermission } from "@/components/auth/require-permission";
import { ScannerView } from "@/features/scanner/scanner-view";
import { Perm } from "@/lib/permissions";

export const metadata: Metadata = { title: "Face Scanner" };

export default function ScannerPage() {
  return (
    <RequirePermission requires={{ all: [Perm.SCAN_RUN] }}>
      <ScannerView />
    </RequirePermission>
  );
}
