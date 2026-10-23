"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useMemo } from "react";

import { RequirePermission } from "@/components/auth/require-permission";
import { DataTable, type DataTableFeatures } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Perm } from "@/lib/permissions";

type DepartmentRow = {
  code: string;
  name: string;
  name_km: string | null;
  kind: "DEPARTMENT" | "CLASS";
  is_active: boolean;
};

const NO_ROWS: DepartmentRow[] = [];

export function DepartmentsView() {
  const { t } = useI18n();

  const columns = useMemo(() => {
    const helper = createColumnHelper<DataTableFeatures, DepartmentRow>();
    return [
      helper.accessor("code", {
        header: t.departments.colCode,
        cell: (info) => <code className="font-mono text-xs font-semibold">{info.getValue()}</code>,
      }),
      helper.accessor("name", {
        header: t.departments.colName,
        cell: (info) => <span className="font-medium text-foreground">{info.getValue()}</span>,
      }),
      helper.accessor("name_km", {
        header: t.departments.colKhmerName,
        cell: (info) => <span lang="km">{info.getValue() ?? "—"}</span>,
      }),
      helper.accessor("kind", {
        header: t.departments.colKind,
        cell: (info) => (
          <Badge variant="outline" className="text-[11px] font-normal">
            {info.getValue() === "DEPARTMENT" ? t.departments.kindDepartment : t.departments.kindClass}
          </Badge>
        ),
      }),
      helper.accessor("is_active", {
        header: t.departments.colActive,
        cell: (info) => (
          <Badge
            variant={info.getValue() ? "secondary" : "outline"}
            className={info.getValue() ? "text-success border-success/30 bg-success/10 text-[11px]" : "text-[11px]"}
          >
            {info.getValue() ? t.common.yes : t.common.no}
          </Badge>
        ),
      }),
    ];
  }, [t]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.departments.title}
        description={t.departments.subtitle}
        actions={
          <RequirePermission requires={{ all: [Perm.PEOPLE_WRITE] }} fallback={null}>
            <Button size="sm" disabled className="h-8 gap-1.5 text-xs font-semibold">
              <Plus className="size-3.5" aria-hidden /> {t.departments.addDepartment}
            </Button>
          </RequirePermission>
        }
      />

      <DataTable
        caption={t.departments.title}
        columns={columns}
        data={NO_ROWS}
        searchPlaceholder={t.departments.searchPlaceholder}
        emptyState={t.departments.emptyDepartments}
      />
    </div>
  );
}
