"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Check, Minus } from "lucide-react";
import { useMemo } from "react";

import { DataTable, type DataTableColumn, type DataTableFeatures } from "@/components/common/data-table";
import { QueryError } from "@/components/common/query-error";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api/endpoints";
import type { RoleDetail } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";

type MatrixRow = { permission: string } & Record<string, string | boolean>;
const helper = createColumnHelper<DataTableFeatures, MatrixRow>();

/** Permission × role matrix built from GET /api/v1/roles (requires roles.manage). */
export function RolesTable() {
  const roles = useApiQuery("roles", api.roles);
  const { isKhmer, t } = useI18n();

  const { rows, columns } = useMemo(() => buildMatrix(roles.data ?? [], isKhmer ? "សិទ្ធិអនុញ្ញាត" : "Permission"), [roles.data, isKhmer]);

  if (roles.error) return <QueryError error={roles.error} onRetry={roles.reload} />;
  return (
    <DataTable
      caption={t.settings.rolesTitle}
      columns={columns}
      data={rows}
      isLoading={roles.isLoading && !roles.data}
      searchPlaceholder={t.settings.filterPermissions}
      pageSize={25}
    />
  );
}

function buildMatrix(roles: RoleDetail[], permissionHeader: string): { rows: MatrixRow[]; columns: DataTableColumn<MatrixRow>[] } {
  const codes = [...new Set(roles.flatMap((r) => r.permissions))].sort();
  const rows: MatrixRow[] = codes.map((code) => ({
    permission: code,
    ...Object.fromEntries(roles.map((r) => [r.name, r.permissions.includes(code)])),
  }));
  const columns: DataTableColumn<MatrixRow>[] = [
    helper.accessor("permission", {
      header: permissionHeader,
      cell: (info) => <code className="font-mono text-xs">{info.getValue()}</code>,
    }),
    ...roles.map((role) =>
      helper.accessor((row) => row[role.name] === true, {
        id: role.name,
        header: `${role.display_name} (${role.permissions.length})`,
        enableGlobalFilter: false,
        cell: (info) =>
          info.getValue() ? (
            <span className="flex size-5 items-center justify-center rounded-md bg-success/15 text-success">
              <Check className="size-3.5" aria-label="Granted" />
            </span>
          ) : (
            <span className="flex size-5 items-center justify-center rounded-md bg-muted/40 text-muted-foreground/40">
              <Minus className="size-3.5" aria-label="Not granted" />
            </span>
          ),
      }),
    ),
  ];
  return { rows, columns };
}
