import { ScanFace } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center bg-muted/30 p-4 sm:p-6 lg:p-8">
      {/* Top right quick controls */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 sm:gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm space-y-4">
        <Card className="border-border/80 shadow-md">
          <CardHeader className="space-y-2 text-center pb-4">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <ScanFace className="size-6" aria-hidden />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold tracking-tight">FaceTrack AI</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Enter your credentials
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Suspense fallback={<Skeleton className="h-52 w-full rounded-xl" />}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-muted-foreground">
          FaceTrack AI · Biometric &amp; Access System
        </p>
      </div>
    </div>
  );
}
