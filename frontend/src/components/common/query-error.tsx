import { AlertCircle, RotateCw } from "lucide-react";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ApiError, errorMessage } from "@/lib/api/errors";

export function QueryError({ error, onRetry, title = "Could not load data" }: { error: unknown; onRetry?: () => void; title?: string }) {
  const requestId = error instanceof ApiError ? error.requestId : null;
  return (
    <Alert variant="destructive" role="alert">
      <AlertCircle aria-hidden />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {errorMessage(error)}
        {requestId && <span className="block text-xs opacity-80">Request ID: {requestId}</span>}
      </AlertDescription>
      {onRetry && (
        <AlertAction>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCw aria-hidden /> Retry
          </Button>
        </AlertAction>
      )}
    </Alert>
  );
}
