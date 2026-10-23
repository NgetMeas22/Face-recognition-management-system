"use client";

import { useEffect, useState } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { api } from "@/lib/api/endpoints";
import type { Readiness } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const POLL_MS = 30_000;

/** Small dot in the top bar showing whether the backend and database are ready. */
export function ApiStatus() {
  const [ready, setReady] = useState<Readiness | null>(null);

  useEffect(() => {
    let controller = new AbortController();
    const check = () => {
      controller.abort();
      controller = new AbortController();
      api.readiness(controller.signal).then(setReady, () => undefined);
    };
    check();
    const id = setInterval(check, POLL_MS);
    return () => {
      clearInterval(id);
      controller.abort();
    };
  }, []);

  const state = !ready ? "checking" : ready.status === "ok" ? "ok" : ready.status === "degraded" ? "degraded" : "down";
  const label = {
    checking: "Checking API…",
    ok: "API and database ready",
    degraded: "Database migrations pending",
    down: "API or database unavailable",
  }[state];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground" role="status">
          <span
            className={cn(
              "size-2 rounded-full",
              state === "ok" && "bg-success",
              state === "degraded" && "bg-warning",
              state === "down" && "bg-destructive",
              state === "checking" && "bg-muted-foreground/40",
            )}
            aria-hidden
          />
          <span className="hidden lg:inline">{label}</span>
          <span className="sr-only lg:hidden">{label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {ready?.current_revision ? ` · schema ${ready.current_revision}` : ""}
      </TooltipContent>
    </Tooltip>
  );
}
