"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, Info, Loader2, LogIn } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { useAuth } from "@/components/auth/auth-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { safeNextPath } from "@/lib/safe-redirect";

// Mirrors backend LoginRequest: username 1–255 chars (username or email), password 1–128.
const loginSchema = z.object({
  username: z.string().trim().min(1, "Enter your username or email.").max(255),
  password: z.string().min(1, "Enter your password.").max(128, "Password is too long."),
});
type LoginValues = z.infer<typeof loginSchema>;

const REASONS: Record<string, string> = {
  "password-changed": "Your password was changed. Sign in with the new password.",
  expired: "Your session ended. Please sign in again.",
};

export function LoginForm() {
  const { login, status } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const reason = REASONS[params.get("reason") ?? ""];
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  // Already signed in (e.g. restored from the refresh cookie): go straight on.
  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, router, next]);

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      await login(values);
      // Activity keeps this page mounted after navigation; don't leave the password in it.
      form.reset();
      router.replace(next);
    } catch (error) {
      form.resetField("password");
      if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
        for (const detail of error.details) {
          if (detail.field === "username" || detail.field === "password") {
            form.setError(detail.field, { message: detail.message });
          }
        }
      }
      setFormError(errorMessage(error));
    }
  }

  const submitting = form.formState.isSubmitting;
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5" aria-describedby="login-error">
      {reason && !formError && (
        <Alert>
          <Info aria-hidden />
          <AlertDescription>{reason}</AlertDescription>
        </Alert>
      )}
      {formError && (
        <Alert variant="destructive" id="login-error" aria-live="assertive">
          <AlertCircle aria-hidden />
          <AlertTitle>Sign-in failed</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      <FieldGroup>
        <Controller
          name="username"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="username">Username or email</FieldLabel>
              <Input
                {...field}
                id="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={fieldState.invalid}
                disabled={submitting}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                  disabled={submitting}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                </Button>
              </div>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="animate-spin" aria-hidden /> : <LogIn aria-hidden />}
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
