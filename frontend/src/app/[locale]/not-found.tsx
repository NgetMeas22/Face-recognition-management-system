"use client";

import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LocaleLink, useI18n } from "@/lib/i18n";

export default function NotFound() {
  const { isKhmer } = useI18n();
  return (
    <div className="grid min-h-svh place-items-center p-6">
      <div className="max-w-sm space-y-4 text-center">
        <SearchX className="mx-auto size-10 text-muted-foreground" aria-hidden />
        <h1 className="text-xl font-semibold">{isKhmer ? "រកមិនឃើញទំព័រ" : "Page not found"}</h1>
        <p className="text-sm text-muted-foreground">
          {isKhmer ? "ទំព័រដែលអ្នកស្នើសុំមិនមានទេ។" : "The page you asked for does not exist."}
        </p>
        <Button asChild>
          <LocaleLink href="/dashboard">{isKhmer ? "ត្រឡប់ទៅផ្ទាំងគ្រប់គ្រង" : "Back to dashboard"}</LocaleLink>
        </Button>
      </div>
    </div>
  );
}
