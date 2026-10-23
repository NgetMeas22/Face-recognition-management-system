"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function UsersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings?tab=users");
  }, [router]);

  return (
    <div className="grid h-64 place-items-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
