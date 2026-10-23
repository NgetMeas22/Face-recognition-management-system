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
import { useI18n } from "@/lib/i18n";
import { safeNextPath } from "@/lib/safe-redirect";

// Mirrors backend LoginRequest: username 1–255 chars (username or email), password 1–128.
const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(255),
  password: z.string().min(1, "Password is required").max(128, "Password too long"),
});
type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login, status } = useAuth();
  const { isKhmer, t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const reasonParam = params.get("reason") ?? "";

  const reason =
    reasonParam === "password-changed"
      ? t.auth.passwordChanged
      : reasonParam === "expired"
      ? t.auth.sessionExpired
      : null;

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
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4" aria-describedby="login-error">
      {reason && !formError && (
        <Alert className="py-2.5 text-xs">
          <Info className="size-4" aria-hidden />
          <AlertDescription>{reason}</AlertDescription>
        </Alert>
      )}

      {formError && (
        <Alert variant="destructive" id="login-error" aria-live="assertive" className="py-2.5 text-xs">
          <AlertCircle className="size-4" aria-hidden />
          <AlertTitle className="text-xs font-semibold">{t.auth.signInFailed}</AlertTitle>
          <AlertDescription className="text-xs">{formError}</AlertDescription>
        </Alert>
      )}

      <FieldGroup className="space-y-3">
        <Controller
          name="username"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="space-y-1">
              <FieldLabel htmlFor="username" className="text-xs font-medium">
                {t.auth.usernameOrEmail}
              </FieldLabel>
              <Input
                {...field}
                id="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="admin"
                aria-invalid={fieldState.invalid}
                disabled={submitting}
                className="h-9 text-xs sm:text-sm"
              />
              <FieldError errors={fieldState.error ? [{ message: isKhmer ? t.auth.usernameRequired : fieldState.error.message }] : []} />
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="space-y-1">
              <FieldLabel htmlFor="password" className="text-xs font-medium">
                {t.auth.password}
              </FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                  disabled={submitting}
                  className="h-9 pr-9 text-xs sm:text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-1 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
                </Button>
              </div>
              <FieldError errors={fieldState.error ? [{ message: isKhmer ? t.auth.passwordRequired : fieldState.error.message }] : []} />
            </Field>
          )}
        />
      </FieldGroup>

      <Button type="submit" className="w-full h-9 text-xs sm:text-sm font-semibold mt-1" disabled={submitting}>
        {submitting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <LogIn className="size-4" aria-hidden />
        )}
        {submitting ? t.auth.signingIn : t.auth.signIn}
      </Button>
    </form>
  );
}
