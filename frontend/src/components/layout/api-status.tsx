"use client";

import { useEffect, useState } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { api } from "@/lib/api/endpoints";
import type { Readiness } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const POLL_MS = 30_000;

/** Small indicator in the top bar showing whether the backend and database are ready. */
export function ApiStatus() {
  const [ready, setReady] = useState<Readiness | null>(null);
  const { isKhmer } = useI18n();

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
    checking: isKhmer ? "កំពុងពិនិត្យ API…" : "Checking API…",
    ok: isKhmer ? "ប្រព័ន្ធដំណើរការល្អ" : "System online",
    degraded: isKhmer ? "ទិន្នន័យមិនទាន់សម័យ" : "Migrations pending",
    down: isKhmer ? "គ្មានការតភ្ជាប់" : "Offline",
  }[state];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 rounded-full bg-muted/40 px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/70 cursor-default" role="status">
          <span
            className={cn(
              "size-2 rounded-full transition-colors",
              state === "ok" && "bg-success shadow-xs shadow-success/40",
              state === "degraded" && "bg-warning",
              state === "down" && "bg-destructive",
              state === "checking" && "bg-muted-foreground/40",
            )}
            aria-hidden
          />
          <span className="hidden xl:inline font-medium text-[11px]">{label}</span>
          <span className="sr-only xl:hidden">{label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs font-medium">{label}</p>
        {ready?.current_revision && (
          <p className="text-[11px] text-muted-foreground">Revision: {ready.current_revision}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
