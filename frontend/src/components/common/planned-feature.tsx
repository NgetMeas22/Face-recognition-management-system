import { Construction } from "lucide-react";
import type { ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Explains that a feature needs backend endpoints that do not exist yet. The endpoints listed are
 * the *planned* ones from docs/01-architecture.md §1.4 — this component never calls them.
 */
export function PlannedFeature({
  phase,
  endpoints,
  children,
}: {
  phase: string;
  endpoints: string[];
  children?: ReactNode;
}) {
  return (
    <Alert className="border-dashed" data-testid="planned-feature">
      <Construction aria-hidden />
      <AlertTitle>Waiting for the backend ({phase})</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          {children ??
            "This screen is ready, but the FastAPI endpoints it needs are not implemented yet, so no data is shown and nothing is sent."}
        </p>
        <p className="text-xs">Planned endpoints (docs/01-architecture.md §1.4):</p>
        <ul className="flex flex-wrap gap-1.5">
          {endpoints.map((endpoint) => (
            <li key={endpoint}>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{endpoint}</code>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
