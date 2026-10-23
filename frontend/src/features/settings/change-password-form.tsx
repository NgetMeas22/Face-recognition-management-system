"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, type FieldPath } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useAuth } from "@/components/auth/auth-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/endpoints";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { hardNavigate } from "@/lib/hard-navigate";

// Mirrors backend/app/core/security.py password_problems(); the backend re-checks (incl. common passwords).
function schemaFor(username: string) {
  return z
    .object({
      current_password: z.string().min(1, "Enter your current password."),
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
      message: "New password must be different from the current password.",
    });
}

type Values = { current_password: string; new_password: string; confirm_password: string };

export function ChangePasswordForm() {
  const { user } = useAuth();
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
      toast.success("Password changed. Please sign in again.");
      // The backend has revoked every session and cleared the refresh cookie.
      hardNavigate("/login?reason=password-changed");
    } catch (error) {
      if (error instanceof ApiError && error.code === "INVALID_CURRENT_PASSWORD") {
        form.setError("current_password", { message: error.message });
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

  const fields: { name: keyof Values; label: string; autoComplete: string; description?: string }[] = [
    { name: "current_password", label: "Current password", autoComplete: "current-password" },
    {
      name: "new_password",
      label: "New password",
      autoComplete: "new-password",
      description: "At least 10 characters, not repetitive, and must not contain your username.",
    },
    { name: "confirm_password", label: "Confirm new password", autoComplete: "new-password" },
  ];

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="max-w-md space-y-4">
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      <FieldGroup>
        {fields.map((f) => (
          <Controller
            key={f.name}
            name={f.name}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={f.name}>{f.label}</FieldLabel>
                <Input {...field} id={f.name} type="password" autoComplete={f.autoComplete} aria-invalid={fieldState.invalid} />
                {f.description && <FieldDescription>{f.description}</FieldDescription>}
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        ))}
      </FieldGroup>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
        Change password
      </Button>
      <p className="text-xs text-muted-foreground">Changing your password signs you out on every device.</p>
    </form>
  );
}
