import type { Metadata } from "next";

import { RequirePermission } from "@/components/auth/require-permission";
import { DepartmentsView } from "@/features/departments/departments-view";
import { Perm } from "@/lib/permissions";

export const metadata: Metadata = { title: "Departments" };

export default function Page() {
  return (
    <RequirePermission requires={{ all: [Perm.PEOPLE_READ] }}>
      <DepartmentsView />
    </RequirePermission>
  );
}
