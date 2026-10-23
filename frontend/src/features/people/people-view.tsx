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

type PersonRow = {
  person_code: string;
  full_name: string;
  person_type: "EMPLOYEE" | "STUDENT";
  department: string | null;
  position: string | null;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
};

const NO_ROWS: PersonRow[] = [];

export function PeopleView() {
  const { t } = useI18n();

  const columns = useMemo(() => {
    const helper = createColumnHelper<DataTableFeatures, PersonRow>();
    return [
      helper.accessor("person_code", {
        header: t.people.colId,
        cell: (info) => <code className="font-mono text-xs font-semibold">{info.getValue()}</code>,
      }),
      helper.accessor("full_name", {
        header: t.people.colName,
        cell: (info) => <span className="font-medium text-foreground">{info.getValue()}</span>,
      }),
      helper.accessor("person_type", {
        header: t.people.colType,
        cell: (info) => (
          <Badge variant="outline" className="text-[11px] font-normal">
            {info.getValue() === "EMPLOYEE" ? t.people.employee : t.people.student}
          </Badge>
        ),
      }),
      helper.accessor("department", {
        header: t.people.colDepartment,
        cell: (info) => info.getValue() ?? "—",
      }),
      helper.accessor("position", {
        header: t.people.colPosition,
        cell: (info) => info.getValue() ?? "—",
      }),
      helper.accessor("status", {
        header: t.people.colStatus,
        cell: (info) => {
          const val = info.getValue();
          return (
            <Badge
              variant={val === "ACTIVE" ? "secondary" : "outline"}
              className={val === "ACTIVE" ? "text-success border-success/30 bg-success/10 text-[11px]" : "text-[11px]"}
            >
              {val === "ACTIVE" ? t.common.active : val === "INACTIVE" ? t.common.inactive : t.common.archived}
            </Badge>
          );
        },
      }),
    ];
  }, [t]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.people.title}
        description={t.people.subtitle}
        actions={
          <RequirePermission requires={{ all: [Perm.PEOPLE_WRITE] }} fallback={null}>
            <Button size="sm" disabled className="h-8 gap-1.5 text-xs font-semibold">
              <Plus className="size-3.5" aria-hidden /> {t.people.addPerson}
            </Button>
          </RequirePermission>
        }
      />

      <DataTable
        caption={t.people.title}
        columns={columns}
        data={NO_ROWS}
        searchPlaceholder={t.people.searchPlaceholder}
        emptyState={t.people.emptyPeople}
      />
    </div>
  );
}
