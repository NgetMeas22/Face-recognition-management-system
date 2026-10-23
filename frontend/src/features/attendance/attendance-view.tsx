"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { ClipboardCheck, Download } from "lucide-react";
import { useMemo } from "react";

import { RequirePermission } from "@/components/auth/require-permission";
import { DataTable, type DataTableFeatures } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Perm } from "@/lib/permissions";

type AttendanceRow = {
  occurred_at: string;
  person: string;
  event_type: "CHECK_IN" | "CHECK_OUT";
  method: "FACE_LIVE" | "FACE_UPLOAD" | "MANUAL" | "ID_LOOKUP";
  punctuality: "ON_TIME" | "LATE" | null;
};

const NO_ROWS: AttendanceRow[] = [];

export function AttendanceView() {
  const { t } = useI18n();

  const columns = useMemo(() => {
    const helper = createColumnHelper<DataTableFeatures, AttendanceRow>();
    return [
      helper.accessor("occurred_at", {
        header: t.attendance.colTime,
        cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
      }),
      helper.accessor("person", {
        header: t.attendance.colPerson,
        cell: (info) => <span className="font-medium text-foreground">{info.getValue()}</span>,
      }),
      helper.accessor("event_type", {
        header: t.attendance.colEvent,
        cell: (info) => (
          <Badge variant="outline" className="text-[11px] font-normal">
            {info.getValue() === "CHECK_IN" ? t.attendance.checkIn : t.attendance.checkOut}
          </Badge>
        ),
      }),
      helper.accessor("method", {
        header: t.attendance.colMethod,
        cell: (info) => (
          <Badge variant="secondary" className="font-mono text-[10px]">
            {info.getValue()}
          </Badge>
        ),
      }),
      helper.accessor("punctuality", {
        header: t.attendance.colPunctuality,
        cell: (info) => {
          const val = info.getValue();
          if (!val) return "—";
          return (
            <Badge
              variant="outline"
              className={
                val === "ON_TIME"
                  ? "text-success border-success/30 bg-success/10 text-[11px]"
                  : "text-warning-foreground dark:text-warning border-warning/40 bg-warning/15 text-[11px]"
              }
            >
              {val === "ON_TIME" ? t.attendance.onTime : t.attendance.late}
            </Badge>
          );
        },
      }),
    ];
  }, [t]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.attendance.title}
        description={t.attendance.subtitle}
        actions={
          <div className="flex items-center gap-2">
            <RequirePermission requires={{ all: [Perm.ATTENDANCE_WRITE] }} fallback={null}>
              <Button size="sm" disabled className="h-8 gap-1.5 text-xs font-semibold">
                <ClipboardCheck className="size-3.5" aria-hidden /> {t.attendance.manualCheckIn}
              </Button>
            </RequirePermission>
            <RequirePermission requires={{ all: [Perm.REPORTS_EXPORT] }} fallback={null}>
              <Button size="sm" variant="outline" disabled className="h-8 gap-1.5 text-xs">
                <Download className="size-3.5" aria-hidden /> {t.attendance.export}
              </Button>
            </RequirePermission>
          </div>
        }
      />

      <DataTable
        caption={t.attendance.title}
        columns={columns}
        data={NO_ROWS}
        searchPlaceholder={t.attendance.searchPlaceholder}
        emptyState={t.attendance.emptyAttendance}
      />
    </div>
  );
}
