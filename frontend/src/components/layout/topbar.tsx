"use client";

import { usePathname } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { navItemFor } from "@/lib/navigation";
import { ApiStatus } from "./api-status";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function Topbar() {
  const pathname = usePathname();
  const current = navItemFor(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-4">
      <SidebarTrigger aria-label="Toggle navigation" />
      <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />
      <p className="truncate text-sm font-medium">{current?.title ?? "FaceTrack AI"}</p>
      <div className="ml-auto flex items-center gap-1">
        <ApiStatus />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
