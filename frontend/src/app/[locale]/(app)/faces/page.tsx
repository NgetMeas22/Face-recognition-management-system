import type { Metadata } from "next";

import { RequirePermission } from "@/components/auth/require-permission";
import { FacesView } from "@/features/faces/faces-view";
import { Perm } from "@/lib/permissions";

export const metadata: Metadata = { title: "Face Registration" };

export default function FacesPage() {
  return (
    <RequirePermission requires={{ all: [Perm.FACES_ENROLL] }}>
      <FacesView />
    </RequirePermission>
  );
}
