import type { Metadata } from "next";

import { RequirePermission } from "@/components/auth/require-permission";
import { SettingsView } from "@/features/settings/settings-view";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  // No permission needed beyond being signed in; this also shows the skeleton while the
  // session is restored, so the view never mounts without a user.
  return (
    <RequirePermission>
      <SettingsView />
    </RequirePermission>
  );
}
