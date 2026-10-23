"use client";

import { BarChart3, FileSpreadsheet, FileText } from "lucide-react";

import { RequirePermission } from "@/components/auth/require-permission";
import { PageHeader } from "@/components/common/page-header";
import { PlannedFeature } from "@/components/common/planned-feature";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Perm } from "@/lib/permissions";

const REPORTS = [
  { title: "Attendance summary", description: "Present, absent and late counts by day, department or class." },
  { title: "Attendance trend", description: "Daily, weekly and monthly charts." },
  { title: "Scan outcomes", description: "Matches, reviews and unknown-face events over time." },
];

export function ReportsView() {
  return (
    <>
      <PageHeader title="Reports" description="Attendance and recognition reports with CSV and Excel export." availability="planned" />
      <div className="space-y-4">
        <PlannedFeature
          phase="Phase 6"
          endpoints={["GET /reports/attendance?from=&to=&department_id=&format=json|csv|xlsx", "GET /reports/scans"]}
        />
        <div className="grid gap-4 md:grid-cols-3">
          {REPORTS.map((r) => (
            <Card key={r.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="size-4 text-muted-foreground" aria-hidden /> {r.title}
                </CardTitle>
                <CardDescription>{r.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid h-32 place-items-center rounded-lg border border-dashed text-xs text-muted-foreground">
                  No data yet
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <RequirePermission requires={{ all: [Perm.REPORTS_EXPORT] }} fallback={null}>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled>
              <FileText aria-hidden /> Export CSV
            </Button>
            <Button variant="outline" disabled>
              <FileSpreadsheet aria-hidden /> Export Excel
            </Button>
          </div>
        </RequirePermission>
      </div>
    </>
  );
}
