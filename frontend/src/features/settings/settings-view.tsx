"use client";

import {
  Check,
  Globe,
  Lock,
  Monitor,
  Moon,
  Server,
  ShieldCheck,
  Sun,
  User,
  Users,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Suspense, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { RequirePermission } from "@/components/auth/require-permission";
import { PageHeader } from "@/components/common/page-header";
import { PlannedFeature } from "@/components/common/planned-feature";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api/endpoints";
import { useI18n, type Locale } from "@/lib/i18n";
import { Perm } from "@/lib/permissions";
import { ChangePasswordForm } from "./change-password-form";
import { RolesTable } from "./roles-table";

function SystemStatus() {
  const health = useApiQuery("health", api.health);
  const ready = useApiQuery("ready", api.readiness);
  const { isKhmer, t } = useI18n();

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
          {t.settings.apiLabel}
        </span>
        <div className="flex items-center gap-2">
          <Badge
            variant={health.error ? "destructive" : "secondary"}
            className={health.error ? "text-[11px]" : "bg-success/15 text-success border-success/30 text-[11px]"}
          >
            {health.error ? t.common.offline : t.common.online}
          </Badge>
          {health.data && (
            <span className="text-xs font-mono text-muted-foreground">v{health.data.version}</span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
          {t.settings.databaseLabel}
        </span>
        <div className="flex items-center gap-2">
          <Badge
            variant={ready.data?.database === "ok" ? "secondary" : "destructive"}
            className={ready.data?.database === "ok" ? "bg-success/15 text-success border-success/30 text-[11px]" : "text-[11px]"}
          >
            {ready.data?.database === "ok" ? t.common.connected : t.common.unavailable}
          </Badge>
          <span className="text-xs text-muted-foreground">{ready.data?.status ?? "…"}</span>
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
          {t.settings.schemaLabel}
        </span>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[11px]">
            {ready.data?.current_revision ?? "none"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {ready.data?.migrations === "up_to_date"
              ? isKhmer
                ? "ទាន់សម័យ"
                : "Up to date"
              : ready.data?.migrations ?? "…"}
          </span>
        </div>
      </div>
    </div>
  );
}

function SettingsContent() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isKhmer, locale, setLocale, t } = useI18n();
  const searchParams = useSearchParams();

  const initialTab = searchParams.get("tab") || "account";
  const [tab, setTab] = useState(initialTab);

  const THEMES = [
    { value: "light", label: t.settings.themeLight, icon: Sun },
    { value: "dark", label: t.settings.themeDark, icon: Moon },
    { value: "system", label: t.settings.themeSystem, icon: Monitor },
  ] as const;

  const LANGUAGES: { code: Locale; label: string; nativeName: string; flag: string }[] = [
    { code: "en", label: "English", nativeName: "English (EN)", flag: "🇬🇧" },
    { code: "km", label: "Khmer", nativeName: "ភាសាខ្មែរ (KH)", flag: "🇰🇭" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.settings.title}
        description={t.settings.subtitle}
        availability="live"
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-xl h-9">
          <TabsTrigger value="account" className="text-xs font-semibold gap-1.5">
            <User className="size-3.5" />
            {t.settings.tabAccount}
          </TabsTrigger>
          <TabsTrigger value="general" className="text-xs font-semibold gap-1.5">
            <Globe className="size-3.5" />
            {t.settings.tabGeneral}
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs font-semibold gap-1.5">
            <Users className="size-3.5" />
            {t.settings.tabUsers}
          </TabsTrigger>
          <TabsTrigger value="system" className="text-xs font-semibold gap-1.5">
            <Server className="size-3.5" />
            {t.settings.tabSystem}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Account & Password */}
        <TabsContent value="account" className="space-y-6">
          <Card className="border-border/80 shadow-xs" id="account">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-base font-semibold">{t.settings.accountTitle}</CardTitle>
              <CardDescription className="text-xs">{t.settings.accountDesc}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 grid gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-1 py-2 border-b border-border/40 text-xs">
                  <span className="text-muted-foreground">{t.settings.fullName}</span>
                  <span className="col-span-2 font-medium text-foreground">{user?.full_name}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 py-2 border-b border-border/40 text-xs">
                  <span className="text-muted-foreground">{t.common.username}</span>
                  <span className="col-span-2 font-mono text-foreground">@{user?.username}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 py-2 border-b border-border/40 text-xs">
                  <span className="text-muted-foreground">{t.common.email}</span>
                  <span className="col-span-2 text-foreground">{user?.email}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 py-2 border-b border-border/40 text-xs">
                  <span className="text-muted-foreground">{t.common.role}</span>
                  <span className="col-span-2">
                    <Badge variant="secondary" className="text-[11px] font-semibold">
                      {user?.role.display_name}
                    </Badge>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 py-2 text-xs">
                  <span className="text-muted-foreground">{isKhmer ? "ចូលចុងក្រោយ" : "Last sign-in"}</span>
                  <span className="col-span-2 text-muted-foreground">
                    {user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : "—"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border/80 bg-muted/20 p-5 space-y-3">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <Lock className="size-4 text-primary" />
                  <h3>{t.settings.changePasswordTitle}</h3>
                </div>
                <ChangePasswordForm />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: General (Language & Appearance) */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Language Switcher Card */}
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="size-4 text-primary" />
                  {t.settings.language}
                </CardTitle>
                <CardDescription className="text-xs">{t.settings.languageDesc}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                {LANGUAGES.map((lang) => {
                  const isActive = lang.code === locale;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setLocale(lang.code)}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                        isActive
                          ? "border-primary bg-primary/5 text-primary shadow-xs font-semibold"
                          : "border-border/80 hover:bg-muted/40 text-foreground font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl" role="img" aria-hidden>
                          {lang.flag}
                        </span>
                        <div>
                          <p className="text-xs font-semibold">{lang.nativeName}</p>
                          <p className="text-[11px] text-muted-foreground">{lang.label}</p>
                        </div>
                      </div>
                      {isActive && <Check className="size-4 text-primary" />}
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Appearance Card */}
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sun className="size-4 text-primary" />
                  {t.settings.appearance}
                </CardTitle>
                <CardDescription className="text-xs">{t.settings.appearanceDesc}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div role="radiogroup" aria-label="Theme selection" className="grid grid-cols-3 gap-2">
                  {THEMES.map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      role="radio"
                      aria-checked={theme === value}
                      variant={theme === value ? "default" : "outline"}
                      onClick={() => setTheme(value)}
                      className="h-14 flex-col gap-1 text-xs font-medium"
                    >
                      <Icon className="size-4" aria-hidden />
                      {label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: User Management & Roles */}
        <TabsContent value="users" className="space-y-6">
          <RequirePermission
            requires={{ all: [Perm.ROLES_MANAGE] }}
            fallback={
              <Card className="border-border/80 shadow-xs">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">{t.settings.userManagementTitle}</CardTitle>
                  <CardDescription className="text-xs">
                    {isKhmer
                      ? "ទំព័រនេះតម្រូវឱ្យមានសិទ្ធិអ្នកគ្រប់គ្រង (roles.manage)។"
                      : "Administrator permissions required (roles.manage)."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-32 flex items-center justify-center text-xs text-muted-foreground">
                  <ShieldCheck className="size-6 mr-2 opacity-50" />
                  {isKhmer ? "គ្មានសិទ្ធិចូលមើលតារាងនេះទេ" : "Access restricted to administrators"}
                </CardContent>
              </Card>
            }
          >
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-base font-semibold">{t.settings.rolesTitle}</CardTitle>
                <CardDescription className="text-xs">{t.settings.rolesDesc}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <RolesTable />
              </CardContent>
            </Card>
          </RequirePermission>
        </TabsContent>

        {/* Tab 4: System & Diagnostics */}
        <TabsContent value="system" className="space-y-6">
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold">{t.settings.systemTitle}</CardTitle>
              <CardDescription className="text-xs">{t.settings.systemDesc}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <SystemStatus />
            </CardContent>
          </Card>

          <RequirePermission requires={{ all: [Perm.SETTINGS_MANAGE] }} fallback={null}>
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm font-semibold">
                  {isKhmer ? "ការកំណត់ការស្គាល់មុខ និងរក្សាទុកទិន្នន័យ" : "Recognition & Data Retention"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isKhmer
                    ? "កម្រិតពិន្ទុភាពដូចគ្នា រយៈពេលស្កេនស្ទួន និងគោលការណ៍រក្សាទុកទិន្នន័យ។"
                    : "Thresholds, duplicate prevention window, and data retention policies."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <PlannedFeature
                  phase="Phase 6"
                  endpoints={["GET /settings", "PATCH /settings", "POST /settings/retention/run"]}
                >
                  {isKhmer
                    ? "តម្លៃលំនាំដើមត្រូវបានកំណត់ក្នុង system_settings រួចរាល់ហើយ ដោយរង់ចាំ API សម្រាប់ធ្វើបច្ចុប្បន្នភាព។"
                    : "Default thresholds are stored in the database and will be configurable when the Settings API is connected."}
                </PlannedFeature>
              </CardContent>
            </Card>
          </RequirePermission>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function SettingsView() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <SettingsContent />
    </Suspense>
  );
}
