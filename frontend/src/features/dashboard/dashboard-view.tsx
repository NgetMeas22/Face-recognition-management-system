"use client";

import { Activity, CalendarCheck, Database, KeyRound, ScanFace, ShieldCheck, UserX, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { useAuth } from "@/components/auth/auth-provider";
import { RequirePermission } from "@/components/auth/require-permission";
import { PageHeader } from "@/components/common/page-header";
import { PlannedFeature } from "@/components/common/planned-feature";
import { QueryError } from "@/components/common/query-error";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api/endpoints";
import { Perm } from "@/lib/permissions";

function greeting(): string {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

const chartConfig = {
  permissions: { label: "Permissions", color: "var(--chart-1)" },
} satisfies ChartConfig;

function RolePermissionsChart() {
  const roles = useApiQuery("roles", api.roles);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions per role</CardTitle>
        <CardDescription>Live from GET /api/v1/roles</CardDescription>
      </CardHeader>
      <CardContent>
        {roles.error ? (
          <QueryError error={roles.error} onRetry={roles.reload} />
        ) : roles.isLoading && !roles.data ? (
          <Skeleton className="h-56 w-full" />
        ) : (
          <ChartContainer config={chartConfig} className="h-56 w-full" aria-label="Bar chart of permission count per role">
            <BarChart
              accessibilityLayer
              data={(roles.data ?? []).map((r) => ({ role: r.display_name, permissions: r.permissions.length }))}
              margin={{ left: -16, right: 8 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="role" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="permissions" fill="var(--color-permissions)" radius={6} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardView() {
  const { user } = useAuth();
  const health = useApiQuery("health", api.health);
  const ready = useApiQuery("ready", api.readiness);

  const readyState = ready.data?.status;
  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user?.full_name.split(" ")[0] ?? ""}`}
        description="System status and your access. Attendance and recognition metrics appear here once those backend APIs exist."
        availability="partial"
      />

      <section aria-label="System status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="API"
          icon={Activity}
          isLoading={health.isLoading && !health.data}
          tone={health.error ? "danger" : "success"}
          value={health.error ? "Offline" : "Online"}
          hint={health.data ? `v${health.data.version} · ${health.data.environment}` : health.error ? "GET /health failed" : undefined}
        />
        <StatCard
          title="Database"
          icon={Database}
          isLoading={ready.isLoading && !ready.data}
          tone={readyState === "ok" ? "success" : readyState === "degraded" ? "warning" : "danger"}
          value={ready.data?.database === "ok" ? "Connected" : "Unavailable"}
          hint={
            ready.data
              ? ready.data.migrations === "up_to_date"
                ? `Schema ${ready.data.current_revision} (up to date)`
                : `Migrations ${ready.data.migrations}`
              : undefined
          }
        />
        <StatCard title="Your role" icon={ShieldCheck} value={user?.role.display_name ?? "—"} hint={`@${user?.username}`} />
        <StatCard title="Your permissions" icon={KeyRound} value={user?.permissions.length ?? 0} hint="Granted by your role" />
      </section>

      <section aria-label="Attendance metrics" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active people" icon={Users} tone="muted" value="—" hint="Needs people API (Phase 3)" />
        <StatCard title="Present today" icon={CalendarCheck} tone="muted" value="—" hint="Needs attendance API (Phase 6)" />
        <StatCard title="Scans today" icon={ScanFace} tone="muted" value="—" hint="Needs scan API (Phase 4)" />
        <StatCard title="Unknown faces" icon={UserX} tone="muted" value="—" hint="Needs scan API (Phase 4)" />
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <RequirePermission
          requires={{ all: [Perm.ROLES_MANAGE] }}
          fallback={
            <Card>
              <CardHeader>
                <CardTitle>Permissions per role</CardTitle>
                <CardDescription>Visible to administrators (roles.manage).</CardDescription>
              </CardHeader>
            </Card>
          }
        >
          <RolePermissionsChart />
        </RequirePermission>

        <Card>
          <CardHeader>
            <CardTitle>Your access</CardTitle>
            <CardDescription>Permissions from GET /api/v1/auth/me</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-1.5">
              {user?.permissions.map((p) => (
                <li key={p}>
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {p}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <PlannedFeature
          phase="Phases 4 & 6"
          endpoints={["GET /dashboard/summary?date=", "GET /dashboard/trend?range=daily|weekly|monthly"]}
        >
          Daily, weekly and monthly attendance charts and recent scan activity will be drawn here from the dashboard API.
        </PlannedFeature>
      </div>
    </>
  );
}
