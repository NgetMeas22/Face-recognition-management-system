"use client";

import { createColumnHelper } from "@tanstack/react-table";

import { OutcomeLegend } from "@/components/camera/outcome-legend";
import { DataTable, type DataTableFeatures } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { PlannedFeature } from "@/components/common/planned-feature";

// Shape of planned scan decisions (docs/02-database-schema.md `scan_events`). No images are stored.
type ScanRow = {
  created_at: string;
  mode: "LIVE" | "UPLOAD";
  outcome: "MATCH" | "REVIEW" | "NO_MATCH" | "LOW_QUALITY" | "NO_FACE" | "LIVENESS_FAILED";
  score: number | null;
  person: string | null;
  scanned_by: string;
};

const helper = createColumnHelper<DataTableFeatures, ScanRow>();
const columns = [
  helper.accessor("created_at", { header: "Time" }),
  helper.accessor("mode", { header: "Mode" }),
  helper.accessor("outcome", { header: "Outcome" }),
  helper.accessor("score", { header: "Score" }),
  helper.accessor("person", { header: "Matched person" }),
  helper.accessor("scanned_by", { header: "Operator" }),
];
const NO_ROWS: ScanRow[] = [];

export function ScansView() {
  return (
    <>
      <PageHeader
        title="Scan History"
        description="Every recognition decision, including unknown faces. Only scores and outcomes are kept — never the image or embedding."
        availability="planned"
      />
      <div className="space-y-4">
        <PlannedFeature phase="Phase 4" endpoints={["GET /scan/events?outcome=&from=&to=&page="]} />
        <OutcomeLegend />
        <DataTable caption="Scan events" columns={columns} data={NO_ROWS} emptyState="No scan events — the scan API is not implemented yet." />
      </div>
    </>
  );
}
