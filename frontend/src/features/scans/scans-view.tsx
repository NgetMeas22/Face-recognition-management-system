"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";

import { OutcomeLegend } from "@/components/camera/outcome-legend";
import { DataTable, type DataTableFeatures } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";

type ScanRow = {
  created_at: string;
  mode: "LIVE" | "UPLOAD";
  outcome: "MATCH" | "REVIEW" | "NO_MATCH" | "LOW_QUALITY" | "NO_FACE" | "LIVENESS_FAILED";
  score: number | null;
  person: string | null;
  scanned_by: string;
};

const NO_ROWS: ScanRow[] = [];

export function ScansView() {
  const { isKhmer, t } = useI18n();

  const columns = useMemo(() => {
    const helper = createColumnHelper<DataTableFeatures, ScanRow>();
    return [
      helper.accessor("created_at", {
        header: t.scans.colTime,
        cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
      }),
      helper.accessor("mode", {
        header: t.scans.colMode,
        cell: (info) => (
          <Badge variant="outline" className="text-[11px] font-normal">
            {info.getValue() === "LIVE" ? t.scans.modeLive : t.scans.modeUpload}
          </Badge>
        ),
      }),
      helper.accessor("outcome", {
        header: t.scans.colOutcome,
        cell: (info) => {
          const outcome = info.getValue();
          return (
            <Badge
              variant="outline"
              className={
                outcome === "MATCH"
                  ? "border-success/30 bg-success/10 text-success text-[11px]"
                  : outcome === "REVIEW"
                  ? "border-warning/40 bg-warning/15 text-warning-foreground dark:text-warning text-[11px]"
                  : "border-destructive/30 bg-destructive/10 text-destructive text-[11px]"
              }
            >
              {outcome === "MATCH"
                ? t.scanner.match
                : outcome === "REVIEW"
                ? t.scanner.needsReview
                : t.scanner.noMatch}
            </Badge>
          );
        },
      }),
      helper.accessor("score", {
        header: t.scans.colScore,
        cell: (info) => {
          const score = info.getValue();
          return score !== null ? <span className="font-mono text-xs font-semibold">{score.toFixed(2)}</span> : "—";
        },
      }),
      helper.accessor("person", {
        header: t.scans.colPerson,
        cell: (info) => info.getValue() ?? (isKhmer ? "គ្មាន (មិនស្គាល់)" : "Unknown"),
      }),
      helper.accessor("scanned_by", {
        header: t.scans.colOperator,
        cell: (info) => <code className="font-mono text-xs">@{info.getValue()}</code>,
      }),
    ];
  }, [isKhmer, t]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.scans.title}
        description={t.scans.subtitle}
      />

      <div className="space-y-4">
        <OutcomeLegend />

        <DataTable
          caption={t.scans.title}
          columns={columns}
          data={NO_ROWS}
          emptyState={t.scans.emptyScans}
        />
      </div>
    </div>
  );
}
