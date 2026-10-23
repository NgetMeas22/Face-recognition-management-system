"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError, errorMessage } from "@/lib/api/errors";

export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const requestId = error instanceof ApiError ? error.requestId : null;
  return (
    <Card className="mx-auto mt-10 max-w-lg" role="alert">
      <CardHeader>
        <AlertTriangle className="size-8 text-destructive" aria-hidden />
        <CardTitle>This page hit a problem</CardTitle>
        <CardDescription>{errorMessage(error)}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        {requestId ? <code className="truncate text-xs text-muted-foreground">Request {requestId}</code> : <span />}
        <Button onClick={retry}>Try again</Button>
      </CardContent>
    </Card>
  );
}
