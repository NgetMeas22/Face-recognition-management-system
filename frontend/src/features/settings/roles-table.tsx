"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Check, Minus } from "lucide-react";
import { useMemo } from "react";

import { DataTable, type DataTableColumn, type DataTableFeatures } from "@/components/common/data-table";
import { QueryError } from "@/components/common/query-error";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api/endpoints";
import type { RoleDetail } from "@/lib/api/types";

type MatrixRow = { permission: string } & Record<string, string | boolean>;
const helper = createColumnHelper<DataTableFeatures, MatrixRow>();

/** Permission × role matrix built from GET /api/v1/roles (requires roles.manage). */
export function RolesTable() {
  const roles = useApiQuery("roles", api.roles);

  const { rows, columns } = useMemo(() => buildMatrix(roles.data ?? []), [roles.data]);

  if (roles.error) return <QueryError error={roles.error} onRetry={roles.reload} />;
  return (
    <DataTable
      caption="Permissions by role"
      columns={columns}
      data={rows}
      isLoading={roles.isLoading && !roles.data}
      searchPlaceholder="Filter permissions…"
      pageSize={25}
    />
  );
}

function buildMatrix(roles: RoleDetail[]): { rows: MatrixRow[]; columns: DataTableColumn<MatrixRow>[] } {
  const codes = [...new Set(roles.flatMap((r) => r.permissions))].sort();
  const rows: MatrixRow[] = codes.map((code) => ({
    permission: code,
    ...Object.fromEntries(roles.map((r) => [r.name, r.permissions.includes(code)])),
  }));
  const columns: DataTableColumn<MatrixRow>[] = [
    helper.accessor("permission", {
      header: "Permission",
      cell: (info) => <code className="text-xs">{info.getValue()}</code>,
    }),
    ...roles.map((role) =>
      helper.accessor((row) => row[role.name] === true, {
        id: role.name,
        header: `${role.display_name} (${role.permissions.length})`,
        enableGlobalFilter: false,
        cell: (info) =>
          info.getValue() ? (
            <Check className="size-4 text-success" aria-label="Granted" />
          ) : (
            <Minus className="size-4 text-muted-foreground/50" aria-label="Not granted" />
          ),
      }),
    ),
  ];
  return { rows, columns };
}
