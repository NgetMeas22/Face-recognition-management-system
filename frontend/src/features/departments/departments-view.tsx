"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Plus } from "lucide-react";

import { RequirePermission } from "@/components/auth/require-permission";
import { DataTable, type DataTableFeatures } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { PlannedFeature } from "@/components/common/planned-feature";
import { Button } from "@/components/ui/button";
import { Perm } from "@/lib/permissions";

// Shape of the planned departments list (docs/02-database-schema.md `departments`).
type DepartmentRow = { code: string; name: string; name_km: string | null; kind: "DEPARTMENT" | "CLASS"; is_active: boolean };

const helper = createColumnHelper<DataTableFeatures, DepartmentRow>();
const columns = [
  helper.accessor("code", { header: "Code" }),
  helper.accessor("name", { header: "Name" }),
  helper.accessor("name_km", { header: "Khmer name", cell: (info) => <span lang="km">{info.getValue()}</span> }),
  helper.accessor("kind", { header: "Type" }),
  helper.accessor("is_active", { header: "Active", cell: (info) => (info.getValue() ? "Yes" : "No") }),
];
const NO_ROWS: DepartmentRow[] = [];

export function DepartmentsView() {
  return (
    <>
      <PageHeader
        title="Departments & Classes"
        description="Departments group employees; classes group students."
        availability="planned"
        actions={
          <RequirePermission requires={{ all: [Perm.PEOPLE_WRITE] }} fallback={null}>
            <Button disabled>
              <Plus aria-hidden /> Add department
            </Button>
          </RequirePermission>
        }
      />
      <div className="space-y-4">
        <PlannedFeature phase="Phase 3" endpoints={["GET /departments", "POST /departments", "PATCH /departments/{id}", "DELETE /departments/{id}"]}>
          Five sample departments and classes are already in the database (from <code>python -m app.cli seed --demo</code>), but no
          API exposes them yet.
        </PlannedFeature>
        <DataTable caption="Departments and classes" columns={columns} data={NO_ROWS} emptyState="No departments to show — the departments API is not implemented yet." />
      </div>
    </>
  );
}
