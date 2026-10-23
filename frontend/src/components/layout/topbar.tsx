"use client";

import { usePathname } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { navItemFor } from "@/lib/navigation";
import { useI18n } from "@/lib/i18n";
import { ApiStatus } from "./api-status";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function Topbar() {
  const pathname = usePathname();
  const current = navItemFor(pathname);
  const { t } = useI18n();

  const title = current?.titleKey ? t.nav[current.titleKey] : t.common.appName;

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 sm:px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger aria-label="Toggle navigation" />
        <Separator orientation="vertical" className="mx-1 h-4" />
        <h1 className="text-sm font-semibold tracking-tight text-foreground truncate">{title}</h1>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <LanguageSwitcher />
        <Separator orientation="vertical" className="h-4 hidden sm:block" />
        <ApiStatus />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
