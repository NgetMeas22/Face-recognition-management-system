"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { useAuth } from "@/components/auth/auth-provider";
import { RequirePermission } from "@/components/auth/require-permission";
import { PageHeader } from "@/components/common/page-header";
import { PlannedFeature } from "@/components/common/planned-feature";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api/endpoints";
import { Perm } from "@/lib/permissions";
import { ChangePasswordForm } from "./change-password-form";
import { RolesTable } from "./roles-table";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
      <dt className="w-40 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function SystemStatus() {
  const health = useApiQuery("health", api.health);
  const ready = useApiQuery("ready", api.readiness);
  return (
    <dl className="divide-y">
      <Row label="API">{health.error ? <Badge variant="destructive">Offline</Badge> : health.data ? `${health.data.app} v${health.data.version} (${health.data.environment})` : "…"}</Row>
      <Row label="Database">{ready.data ? ready.data.database : "…"}</Row>
      <Row label="Schema revision">
        {ready.data ? `${ready.data.current_revision ?? "none"} (head ${ready.data.head_revision ?? "?"}) · ${ready.data.migrations}` : "…"}
      </Row>
    </dl>
  );
}

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function SettingsView() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <>
      <PageHeader title="Settings" description="Your account, appearance, roles and system configuration." availability="partial" />
      <div className="grid gap-6">
        <Card id="account">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>From GET /api/v1/auth/me</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-8 lg:grid-cols-2">
            <dl className="divide-y">
              <Row label="Name">{user?.full_name}</Row>
              <Row label="Username">@{user?.username}</Row>
              <Row label="Email">{user?.email}</Row>
              <Row label="Role">{user?.role.display_name}</Row>
              <Row label="Last sign-in">{user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : "—"}</Row>
            </dl>
            <div>
              <h3 className="mb-3 text-sm font-medium">Change password</h3>
              <ChangePasswordForm />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Stored in this browser only.</CardDescription>
          </CardHeader>
          <CardContent>
            <div role="radiogroup" aria-label="Theme" className="flex flex-wrap gap-2">
              {THEMES.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  role="radio"
                  aria-checked={theme === value}
                  variant={theme === value ? "default" : "outline"}
                  onClick={() => setTheme(value)}
                >
                  <Icon aria-hidden /> {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <RequirePermission requires={{ all: [Perm.ROLES_MANAGE] }} fallback={null}>
          <Card>
            <CardHeader>
              <CardTitle>Roles &amp; permissions</CardTitle>
              <CardDescription>
                Read-only view from GET /api/v1/roles. Editing roles needs PUT /roles/&#123;id&#125;/permissions (not implemented yet).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RolesTable />
            </CardContent>
          </Card>
        </RequirePermission>

        <Card>
          <CardHeader>
            <CardTitle>System</CardTitle>
            <CardDescription>GET /api/v1/health and /health/ready</CardDescription>
          </CardHeader>
          <CardContent>
            <SystemStatus />
          </CardContent>
        </Card>

        <RequirePermission requires={{ all: [Perm.SETTINGS_MANAGE] }} fallback={null}>
          <Card>
            <CardHeader>
              <CardTitle>Recognition, consent &amp; data retention</CardTitle>
              <CardDescription>Thresholds, duplicate window, work hours and retention periods.</CardDescription>
            </CardHeader>
            <CardContent>
              <PlannedFeature phase="Phase 6" endpoints={["GET /settings", "PATCH /settings", "POST /settings/retention/run"]}>
                The defaults are already seeded in the system_settings table, but there is no API to read or change them yet.
              </PlannedFeature>
            </CardContent>
          </Card>
        </RequirePermission>
      </div>
    </>
  );
}
