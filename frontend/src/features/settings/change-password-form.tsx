"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, type FieldPath } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useAuth } from "@/components/auth/auth-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/endpoints";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { hardNavigate } from "@/lib/hard-navigate";
import { useI18n } from "@/lib/i18n";

// Mirrors backend/app/core/security.py password_problems(); the backend re-checks (incl. common passwords).
function schemaFor(username: string) {
  return z
    .object({
      current_password: z.string().min(1, "Enter current password."),
      new_password: z
        .string()
        .min(10, "Password must be at least 10 characters.")
        .max(128, "Password must be at most 128 characters.")
        .refine((v) => new Set(v).size >= 4, "Password is too repetitive.")
        .refine((v) => !v.toLowerCase().includes(username.toLowerCase()), "Password must not contain the username."),
      confirm_password: z.string(),
    })
    .refine((v) => v.new_password === v.confirm_password, { path: ["confirm_password"], message: "Passwords do not match." })
    .refine((v) => v.new_password !== v.current_password, {
      path: ["new_password"],
      message: "New password must be different from current password.",
    });
}

type Values = { current_password: string; new_password: string; confirm_password: string };

export function ChangePasswordForm() {
  const { user } = useAuth();
  const { isKhmer, t } = useI18n();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schemaFor(user?.username ?? "")),
    defaultValues: { current_password: "", new_password: "", confirm_password: "" },
  });

  async function onSubmit(values: Values) {
    setFormError(null);
    try {
      await api.changePassword({ current_password: values.current_password, new_password: values.new_password });
      form.reset();
      toast.success(t.settings.passwordChanged);
      hardNavigate("/login?reason=password-changed");
    } catch (error) {
      if (error instanceof ApiError && error.code === "INVALID_CURRENT_PASSWORD") {
        form.setError("current_password", {
          message: isKhmer ? "ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវទេ។" : error.message,
        });
        return;
      }
      if (error instanceof ApiError && error.details.length > 0) {
        for (const detail of error.details) {
          const field = (["current_password", "new_password"] as const).find((f) => f === detail.field);
          if (field) form.setError(field as FieldPath<Values>, { message: detail.message });
        }
        return;
      }
      setFormError(errorMessage(error));
    }
  }

  const submitting = form.formState.isSubmitting;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="max-w-md space-y-4">
      {formError && (
        <Alert variant="destructive" className="py-2.5 text-xs">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <FieldGroup className="space-y-3">
        <Controller
          name="current_password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="space-y-1">
              <FieldLabel htmlFor="current_password" className="text-xs font-medium">
                {t.settings.currentPassword}
              </FieldLabel>
              <Input
                {...field}
                id="current_password"
                type="password"
                autoComplete="current-password"
                aria-invalid={fieldState.invalid}
                disabled={submitting}
                className="h-9 text-xs sm:text-sm"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="new_password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="space-y-1">
              <FieldLabel htmlFor="new_password" className="text-xs font-medium">
                {t.settings.newPassword}
              </FieldLabel>
              <Input
                {...field}
                id="new_password"
                type="password"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
                disabled={submitting}
                className="h-9 text-xs sm:text-sm"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="confirm_password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="space-y-1">
              <FieldLabel htmlFor="confirm_password" className="text-xs font-medium">
                {t.settings.confirmPassword}
              </FieldLabel>
              <Input
                {...field}
                id="confirm_password"
                type="password"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
                disabled={submitting}
                className="h-9 text-xs sm:text-sm"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>

      <Button type="submit" disabled={submitting} className="h-9 gap-1.5 text-xs font-semibold">
        {submitting ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <KeyRound className="size-3.5" aria-hidden />}
        {submitting ? t.common.loading : t.settings.updatePassword}
      </Button>
    </form>
  );
}
