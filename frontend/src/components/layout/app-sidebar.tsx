"use client";

import { ScanFace } from "lucide-react";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { NAV_GROUPS, NAV_ITEMS } from "@/lib/navigation";
import { LocaleLink, stripLocale, useI18n } from "@/lib/i18n";

export function AppSidebar() {
  const pathname = stripLocale(usePathname()).path;
  const { allows, user, status } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();
  const { t } = useI18n();

  // Hide links the user's role cannot open. The backend still enforces this on every request.
  const visible = NAV_ITEMS.filter((item) => allows(item.requires));

  return (
    <Sidebar collapsible="icon" className="border-r border-border/80">
      <SidebarHeader className="border-b border-border/40 py-2.5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip={t.common.appName}>
              <LocaleLink href="/dashboard" className="gap-3 transition-colors">
                <span className="flex aspect-square size-9 items-center justify-center rounded-xl bg-primary shadow-sm text-primary-foreground">
                  <ScanFace className="size-5" aria-hidden />
                </span>
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold tracking-tight">{t.common.appName}</span>
                  <span className="truncate text-xs text-muted-foreground">{t.common.tagline}</span>
                </span>
              </LocaleLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {status !== "authenticated" && (
          <SidebarMenu className="gap-1 px-1 pt-2" aria-hidden>
            {Array.from({ length: 7 }, (_, i) => (
              <SidebarMenuItem key={i}>
                <SidebarMenuSkeleton showIcon />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        )}
        {NAV_GROUPS.map((group) => {
          const items = visible.filter((item) => item.group === group.name);
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={group.name} className="py-1.5">
              <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-2">
                {t.nav[group.key]}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const localizedTitle = t.nav[item.titleKey];
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={active} tooltip={localizedTitle} className="h-9 px-2.5">
                          <LocaleLink
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            onClick={() => isMobile && setOpenMobile(false)}
                            className="font-medium text-sm"
                          >
                            <item.icon className="size-4 shrink-0" aria-hidden />
                            <span className="truncate">{localizedTitle}</span>
                          </LocaleLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-3">
        <p className="truncate text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          {t.auth.signedInAs} <span className="font-medium text-foreground">{user?.role.display_name}</span>
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
