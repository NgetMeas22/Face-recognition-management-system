import { ScanFace } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="relative grid min-h-svh place-items-center bg-muted/40 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ScanFace className="size-6" aria-hidden />
          </span>
          <CardTitle className="text-xl">Sign in to FaceTrack AI</CardTitle>
          <CardDescription>
            Use the operator account your administrator created.{" "}
            <span lang="km">ចូលប្រើប្រព័ន្ធ</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* useSearchParams (for ?next=) must sit inside Suspense so the page shell can prerender. */}
          <Suspense fallback={<Skeleton className="h-56 w-full" />}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
