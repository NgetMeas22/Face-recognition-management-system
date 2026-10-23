"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Plus } from "lucide-react";

import { RequirePermission } from "@/components/auth/require-permission";
import { DataTable, type DataTableFeatures } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { PlannedFeature } from "@/components/common/planned-feature";
import { Button } from "@/components/ui/button";
import { Perm } from "@/lib/permissions";

// Shape of the planned people list (docs/02-database-schema.md `people`); no API serves it yet.
type PersonRow = {
  person_code: string;
  full_name: string;
  person_type: "EMPLOYEE" | "STUDENT";
  department: string | null;
  position: string | null;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
};

const helper = createColumnHelper<DataTableFeatures, PersonRow>();
const columns = [
  helper.accessor("person_code", { header: "ID" }),
  helper.accessor("full_name", { header: "Name" }),
  helper.accessor("person_type", { header: "Type" }),
  helper.accessor("department", { header: "Department / class" }),
  helper.accessor("position", { header: "Position / grade" }),
  helper.accessor("status", { header: "Status" }),
];
const NO_ROWS: PersonRow[] = [];

export function PeopleView() {
  return (
    <>
      <PageHeader
        title="Employees & Students"
        description="Search, filter and manage the people who can be enrolled for recognition."
        availability="planned"
        actions={
          <RequirePermission requires={{ all: [Perm.PEOPLE_WRITE] }} fallback={null}>
            <Button disabled>
              <Plus aria-hidden /> Add person
            </Button>
          </RequirePermission>
        }
      />
      <div className="space-y-4">
        <PlannedFeature
          phase="Phase 3"
          endpoints={["GET /people?search=&department_id=&status=&type=&sort=&page=&size=", "POST /people", "GET /people/{id}", "PATCH /people/{id}"]}
        />
        <DataTable
          caption="Employees and students"
          columns={columns}
          data={NO_ROWS}
          searchPlaceholder="Search by name or ID…"
          emptyState="No people to show — the people API is not implemented yet."
        />
      </div>
    </>
  );
}
