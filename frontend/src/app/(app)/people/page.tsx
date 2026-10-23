import type { Metadata } from "next";

import { RequirePermission } from "@/components/auth/require-permission";
import { PeopleView } from "@/features/people/people-view";
import { Perm } from "@/lib/permissions";

export const metadata: Metadata = { title: "Employees & Students" };

export default function Page() {
  return (
    <RequirePermission requires={{ all: [Perm.PEOPLE_READ] }}>
      <PeopleView />
    </RequirePermission>
  );
}
