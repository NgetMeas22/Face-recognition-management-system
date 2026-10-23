import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import type { Availability } from "@/lib/navigation";

const AVAILABILITY_LABEL: Record<Availability, string> = {
  live: "Live",
  partial: "Partially available",
  planned: "Waiting for backend",
};

export function PageHeader({
  title,
  description,
  availability,
  actions,
}: {
  title: string;
  description?: ReactNode;
  availability?: Availability;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {availability && availability !== "live" && (
            <Badge variant={availability === "planned" ? "outline" : "secondary"}>{AVAILABILITY_LABEL[availability]}</Badge>
          )}
        </div>
        {description && <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
