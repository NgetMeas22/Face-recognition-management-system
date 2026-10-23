"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { ClipboardCheck, Download } from "lucide-react";

import { RequirePermission } from "@/components/auth/require-permission";
import { DataTable, type DataTableFeatures } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { PlannedFeature } from "@/components/common/planned-feature";
import { Button } from "@/components/ui/button";
import { Perm } from "@/lib/permissions";

// Shape of planned attendance events (docs/02-database-schema.md `attendance_records`).
type AttendanceRow = {
  occurred_at: string;
  person: string;
  event_type: "CHECK_IN" | "CHECK_OUT";
  method: "FACE_LIVE" | "FACE_UPLOAD" | "MANUAL" | "ID_LOOKUP";
  punctuality: "ON_TIME" | "LATE" | null;
};

const helper = createColumnHelper<DataTableFeatures, AttendanceRow>();
const columns = [
  helper.accessor("occurred_at", { header: "Time" }),
  helper.accessor("person", { header: "Person" }),
  helper.accessor("event_type", { header: "Event" }),
  helper.accessor("method", { header: "Method" }),
  helper.accessor("punctuality", { header: "Punctuality" }),
];
const NO_ROWS: AttendanceRow[] = [];

export function AttendanceView() {
  return (
    <>
      <PageHeader
        title="Attendance"
        description="Check-in and check-out events. Face recognition only assists — manual and ID-based check-in are always equally valid."
        availability="planned"
        actions={
          <>
            <RequirePermission requires={{ all: [Perm.ATTENDANCE_WRITE] }} fallback={null}>
              <Button disabled>
                <ClipboardCheck aria-hidden /> Manual check-in
              </Button>
            </RequirePermission>
            <RequirePermission requires={{ all: [Perm.REPORTS_EXPORT] }} fallback={null}>
              <Button variant="outline" disabled>
                <Download aria-hidden /> Export
              </Button>
            </RequirePermission>
          </>
        }
      />
      <div className="space-y-4">
        <PlannedFeature
          phase="Phase 6"
          endpoints={["GET /attendance", "POST /attendance/manual", "POST /attendance/{id}/void", "POST /attendance/{id}/correct"]}
        />
        <DataTable caption="Attendance events" columns={columns} data={NO_ROWS} searchPlaceholder="Search by person…" emptyState="No attendance records — the attendance API is not implemented yet." />
      </div>
    </>
  );
}
