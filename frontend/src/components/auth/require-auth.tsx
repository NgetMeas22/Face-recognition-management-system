"use client";

import { ServerCrash } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { stripLocale, useLocaleRouter } from "@/lib/i18n";
import { useAuth } from "./auth-provider";

/**
 * Client-side route guard for the protected area. It always renders `children` (the layout and
 * page segments) so Next.js can prerender and validate them; each page shows a skeleton via
 * <RequirePermission> until the session is restored. Anonymous visitors are sent to /login.
 * The backend still authorises every request, so bypassing this in devtools exposes no data.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status, restoreError, retryRestore } = useAuth();
  const router = useLocaleRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "anonymous" && !restoreError) {
      router.replace(`/login?next=${encodeURIComponent(stripLocale(pathname).path)}`);
    }
  }, [status, restoreError, router, pathname]);

  if (status === "anonymous" && restoreError) {
    return (
      <div className="grid min-h-svh place-items-center p-6">
        <div className="max-w-md space-y-4 text-center" role="alert">
          <ServerCrash className="mx-auto size-10 text-destructive" aria-hidden />
          <h1 className="text-lg font-semibold">Cannot reach FaceTrack API</h1>
          <p className="text-sm text-muted-foreground">{restoreError.message}</p>
          <Button onClick={retryRestore}>Try again</Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
