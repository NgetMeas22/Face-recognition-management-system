"use client";

import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

import { PageSkeleton } from "@/components/common/page-skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PermissionRequirement } from "@/lib/permissions";
import { useAuth } from "./auth-provider";

function describe(requirement: PermissionRequirement): string {
  const parts: string[] = [];
  if (requirement.all?.length) parts.push(requirement.all.join(" and "));
  if (requirement.any?.length) parts.push(`one of ${requirement.any.join(", ")}`);
  return parts.join("; ");
}

/**
 * Renders children only when the signed-in user meets `requires`; otherwise an explanation.
 * While the session is still being restored (and in the prerendered shell) it shows a page
 * skeleton, or nothing for inline uses with a `fallback`, so views never mount unauthenticated.
 */
export function RequirePermission({
  requires,
  children,
  fallback,
}: {
  requires?: PermissionRequirement;
  children: ReactNode;
  /** Inline fallback; defaults to a full "access denied" card. Pass null to render nothing. */
  fallback?: ReactNode;
}) {
  const { status, allows, user } = useAuth();
  if (status !== "authenticated") return fallback !== undefined ? null : <PageSkeleton />;
  if (allows(requires)) return <>{children}</>;
  if (fallback !== undefined) return <>{fallback}</>;

  return (
    <Card className="mx-auto mt-10 max-w-lg" role="alert">
      <CardHeader>
        <ShieldAlert className="size-8 text-destructive" aria-hidden />
        <CardTitle>You don&apos;t have access to this page</CardTitle>
        <CardDescription>
          Your role <strong>{user?.role.display_name}</strong> is missing the permission{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">{requires ? describe(requires) : ""}</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Ask an administrator to change your role if you need this page.
      </CardContent>
    </Card>
  );
}
