"use client";

import { Loader2, ServerCrash } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "./auth-provider";

/**
 * Client-side route guard. It only decides what to *render*; the backend still authorises every
 * request, so bypassing this in devtools exposes no data.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status, restoreError, retryRestore } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "anonymous" && !restoreError) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, restoreError, router, pathname]);

  if (status === "authenticated") return <>{children}</>;

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

  return (
    <div className="grid min-h-svh place-items-center" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Checking your session…
      </div>
    </div>
  );
}
