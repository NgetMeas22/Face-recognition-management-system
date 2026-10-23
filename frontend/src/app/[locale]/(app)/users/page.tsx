"use client";

import { Loader2 } from "lucide-react";
import { useEffect } from "react";

import { useLocaleRouter } from "@/lib/i18n";

export default function UsersRedirectPage() {
  const router = useLocaleRouter();

  useEffect(() => {
    router.replace("/settings?tab=users");
  }, [router]);

  return (
    <div className="grid h-64 place-items-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
