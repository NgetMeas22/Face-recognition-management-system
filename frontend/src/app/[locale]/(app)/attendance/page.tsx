import type { Metadata } from "next";

import { RequirePermission } from "@/components/auth/require-permission";
import { AttendanceView } from "@/features/attendance/attendance-view";
import { Perm } from "@/lib/permissions";

export const metadata: Metadata = { title: "Attendance" };

export default function Page() {
  return (
    <RequirePermission requires={{ all: [Perm.ATTENDANCE_READ] }}>
      <AttendanceView />
    </RequirePermission>
  );
}
