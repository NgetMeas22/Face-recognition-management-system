"use client";

import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Database,
  KeyRound,
  ScanFace,
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { useAuth } from "@/components/auth/auth-provider";
import { RequirePermission } from "@/components/auth/require-permission";
import { PageHeader } from "@/components/common/page-header";
import { QueryError } from "@/components/common/query-error";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api/endpoints";
import { useI18n } from "@/lib/i18n";
import { Perm } from "@/lib/permissions";

function getGreeting(hour: number, t: ReturnType<typeof useI18n>["t"]): string {
  if (hour < 12) return t.dashboard.greetingMorning;
  if (hour < 18) return t.dashboard.greetingAfternoon;
  return t.dashboard.greetingEvening;
}

const chartConfig = {
  permissions: { label: "Permissions", color: "var(--chart-1)" },
} satisfies ChartConfig;

function RolePermissionsChart() {
  const roles = useApiQuery("roles", api.roles);
  const { t } = useI18n();

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-0.5">
          <CardTitle className="text-sm font-semibold">{t.dashboard.permissionsPerRole}</CardTitle>
          <CardDescription className="text-xs">Live /api/v1/roles</CardDescription>
        </div>
        <Badge variant="outline" className="text-[10px] font-normal">
          {roles.data?.length ?? 0} roles
        </Badge>
      </CardHeader>
      <CardContent className="pt-2">
        {roles.error ? (
          <QueryError error={roles.error} onRetry={roles.reload} />
        ) : roles.isLoading && !roles.data ? (
          <Skeleton className="h-52 w-full rounded-lg" />
        ) : (
          <ChartContainer config={chartConfig} className="h-52 w-full" aria-label="Permissions by role chart">
            <BarChart
              accessibilityLayer
              data={(roles.data ?? []).map((r) => ({ role: r.display_name, permissions: r.permissions.length }))}
              margin={{ top: 8, left: -20, right: 8, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="role" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} fontSize={11} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="permissions" fill="var(--color-permissions)" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardView() {
  const { user } = useAuth();
  const { isKhmer, t } = useI18n();
  const health = useApiQuery("health", api.health);
  const ready = useApiQuery("ready", api.readiness);

  const readyState = ready.data?.status;
  const currentHour = new Date().getHours();
  const greeting = getGreeting(currentHour, t);
  const firstName = user?.full_name ? user.full_name.split(" ")[0] : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${firstName}`}
        description={t.dashboard.subtitle}
        availability="live"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" asChild className="h-8 gap-1.5 text-xs font-semibold shadow-xs">
              <Link href="/scanner">
                <ScanFace className="size-3.5" aria-hidden />
                {t.dashboard.startScanning}
              </Link>
            </Button>
          </div>
        }
      />

      {/* 4 Primary Operational Metric Cards */}
      <section aria-label="Core metrics" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t.dashboard.totalPeople}
          icon={Users}
          value="—"
          hint={isKhmer ? "រង់ចាំទិន្នន័យពី People API" : "Awaiting People API"}
          tone="default"
        />
        <StatCard
          title={t.dashboard.presentToday}
          icon={UserCheck}
          value="0"
          hint={isKhmer ? "គ្មានវត្តមានកត់ត្រានៅឡើយ" : "No attendance recorded yet"}
          tone="success"
        />
        <StatCard
          title={t.dashboard.absentToday}
          icon={UserX}
          value="0"
          hint={isKhmer ? "ផ្អែកលើការកត់ត្រាវត្តមាន" : "Based on daily roster"}
          tone="warning"
        />
        <StatCard
          title={t.dashboard.recentScans}
          icon={ScanFace}
          value="0"
          hint={isKhmer ? "ព្រឹត្តិការណ៍ស្កេនថ្ងៃនេះ" : "Events scanned today"}
          tone="default"
        />
      </section>

      {/* System Telemetry & Access Summary */}
      <section aria-label="System status" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t.dashboard.apiStatus}
          icon={Activity}
          isLoading={health.isLoading && !health.data}
          tone={health.error ? "danger" : "success"}
          value={health.error ? t.common.offline : t.common.online}
          hint={
            health.data
              ? `v${health.data.version} · ${health.data.environment}`
              : health.error
              ? "GET /health error"
              : undefined
          }
        />
        <StatCard
          title={t.dashboard.database}
          icon={Database}
          isLoading={ready.isLoading && !ready.data}
          tone={readyState === "ok" ? "success" : readyState === "degraded" ? "warning" : "danger"}
          value={ready.data?.database === "ok" ? t.common.connected : t.common.unavailable}
          hint={
            ready.data
              ? ready.data.migrations === "up_to_date"
                ? `${t.dashboard.upToDate} · ${ready.data.current_revision ?? "rev"}`
                : `Migrations: ${ready.data.migrations}`
              : undefined
          }
        />
        <StatCard
          title={t.dashboard.yourRole}
          icon={ShieldCheck}
          value={user?.role.display_name ?? "—"}
          hint={`@${user?.username}`}
          tone="default"
        />
        <StatCard
          title={t.dashboard.yourPermissions}
          icon={KeyRound}
          value={user?.permissions.length ?? 0}
          hint={isKhmer ? "សិទ្ធិអនុញ្ញាតសរុប" : "Total granted permissions"}
          tone="default"
        />
      </section>

      {/* Main Grid: Visual Chart & Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RequirePermission
          requires={{ all: [Perm.ROLES_MANAGE] }}
          fallback={
            <Card className="border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">{t.dashboard.permissionsPerRole}</CardTitle>
                <CardDescription className="text-xs">
                  {isKhmer ? "អាចមើលឃើញបានសម្រាប់អ្នកគ្រប់គ្រង" : "Visible to administrators (roles.manage)."}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-52 flex items-center justify-center text-xs text-muted-foreground">
                <ShieldCheck className="size-6 mr-2 opacity-50" />
                {isKhmer ? "តម្រូវឱ្យមានសិទ្ធិអ្នកគ្រប់គ្រង" : "Requires administrative role"}
              </CardContent>
            </Card>
          }
        >
          <RolePermissionsChart />
        </RequirePermission>

        {/* Compact Recent Activity Card */}
        <Card className="border-border/80 shadow-xs flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold">{t.dashboard.recentActivity}</CardTitle>
              <CardDescription className="text-xs">
                {isKhmer ? "ការស្កេន និងសកម្មភាពកត់ត្រាថ្ងៃនេះ" : "Live scan and attendance timeline"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-7 text-xs px-2 gap-1">
              <Link href="/scans">
                {t.common.details}
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="rounded-lg border border-dashed border-border/80 p-6 text-center">
              <ScanFace className="size-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs font-medium text-foreground">{t.dashboard.noActivity}</p>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
                {t.dashboard.awaitingEvents}
              </p>
              <Button size="sm" variant="outline" asChild className="mt-3 h-7 text-xs font-medium">
                <Link href="/scanner">{t.dashboard.startScanning}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permissions Breakdown and Quick Access */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold">{t.dashboard.yourAccess}</CardTitle>
              <CardDescription className="text-xs">
                {isKhmer ? "សិទ្ធិអនុញ្ញាតដែលបានផ្តល់ជូនគណនីរបស់អ្នក" : "Permissions granted to your active session"}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">
              {user?.permissions.length ?? 0} {t.dashboard.yourPermissions.toLowerCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-wrap gap-1.5" aria-label="Granted permissions">
            {user?.permissions.map((p) => (
              <li key={p}>
                <Badge variant="outline" className="font-mono text-[11px] bg-muted/30 border-border/60 py-0.5">
                  <CheckCircle2 className="size-3 mr-1 text-success shrink-0" />
                  {p}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
