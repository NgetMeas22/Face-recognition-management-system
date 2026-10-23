"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { Loader2 } from "lucide-react";

export default function EnglishRedirectPage() {
  const router = useRouter();
  const { setLocale } = useI18n();

  useEffect(() => {
    setLocale("en");
    router.replace("/dashboard");
  }, [router, setLocale]);

  return (
    <div className="grid min-h-svh place-items-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
