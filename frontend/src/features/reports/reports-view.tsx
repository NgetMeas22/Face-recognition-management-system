"use client";

import { BarChart3, FileSpreadsheet, FileText, TrendingUp, Users } from "lucide-react";

import { RequirePermission } from "@/components/auth/require-permission";
import { PageHeader } from "@/components/common/page-header";
import { PlannedFeature } from "@/components/common/planned-feature";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { Perm } from "@/lib/permissions";

export function ReportsView() {
  const { isKhmer, t } = useI18n();

  const reportCards = [
    {
      title: t.reports.cardSummaryTitle,
      description: t.reports.cardSummaryDesc,
      icon: Users,
    },
    {
      title: t.reports.cardTrendTitle,
      description: t.reports.cardTrendDesc,
      icon: TrendingUp,
    },
    {
      title: t.reports.cardOutcomesTitle,
      description: t.reports.cardOutcomesDesc,
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.reports.title}
        description={t.reports.subtitle}
        availability="planned"
        actions={
          <RequirePermission requires={{ all: [Perm.REPORTS_EXPORT] }} fallback={null}>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled className="h-8 gap-1.5 text-xs">
                <FileText className="size-3.5" aria-hidden /> {t.reports.exportCsv}
              </Button>
              <Button variant="outline" size="sm" disabled className="h-8 gap-1.5 text-xs">
                <FileSpreadsheet className="size-3.5" aria-hidden /> {t.reports.exportExcel}
              </Button>
            </div>
          </RequirePermission>
        }
      />

      <div className="space-y-4">
        <PlannedFeature
          phase="Phase 6"
          endpoints={[
            "GET /reports/attendance?from=&to=&department_id=&format=json|csv|xlsx",
            "GET /reports/scans",
          ]}
        >
          {isKhmer
            ? "របាយការណ៍សង្ខេបវត្តមាន និន្នាការតាមកាលបរិច្ឆេទ និងការនាំចេញទិន្នន័យនឹងដំណើរការនៅទីនេះ។"
            : "Analytical rollups, attendance distributions, and multi-format exports will render here from the Reports API."}
        </PlannedFeature>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reportCards.map((r, i) => (
            <Card key={i} className="border-border/80 shadow-xs flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <r.icon className="size-4 text-primary" aria-hidden />
                  {r.title}
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed">{r.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid h-36 place-items-center rounded-xl border border-dashed border-border/80 bg-muted/20 text-xs text-muted-foreground">
                  <p>{t.reports.noDataReport}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
