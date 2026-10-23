import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "danger" | "muted";

const TONE: Record<Tone, string> = {
  default: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/20 text-warning-foreground dark:text-warning border-warning/30",
  danger: "bg-destructive/10 text-destructive border-destructive/20",
  muted: "bg-muted text-muted-foreground border-border/50",
};

export function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  tone = "default",
  isLoading = false,
}: {
  title: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: LucideIcon;
  tone?: Tone;
  isLoading?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden border-border/80 shadow-xs transition-all hover:border-border hover:shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        <span className={cn("flex size-8 items-center justify-center rounded-lg border", TONE[tone])}>
          <Icon className="size-4" aria-hidden />
        </span>
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          <Skeleton className="h-8 w-24 rounded" />
        ) : (
          <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">{value}</p>
        )}
        {hint && <p className="text-xs text-muted-foreground/80 truncate">{hint}</p>}
      </CardContent>
    </Card>
  );
}
