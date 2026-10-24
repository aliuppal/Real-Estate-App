"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { forgotPasswordAction, resetPasswordAction } from "@/app/(auth)/actions";
import {
  forgotPasswordSchema, resetPasswordSchema, type ForgotPasswordInput, type ResetPasswordInput,
} from "@/lib/validation/auth";
import { FormError, PasswordField, TextField } from "./fields";

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState<{ message: string; devLink?: string } | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  if (sent) {
    return (
      <div className="space-y-3 rounded-xl bg-secondary p-5" role="status">
        <MailCheck className="size-6" strokeWidth={1.6} aria-hidden />
        <p>{sent.message}</p>
        <p className="text-sm text-muted-foreground">The link expires in 30 minutes.</p>
        {sent.devLink && (
          <p className="text-sm">
            <span className="text-muted-foreground">Email is stubbed in development: </span>
            <Link href={sent.devLink.replace(/^https?:\/\/[^/]+/, "")} className="text-link underline underline-offset-4">
              open the reset link
            </Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          const result = await forgotPasswordAction(values);
          if (result.ok) setSent({ message: result.message ?? "Check your inbox.", devLink: result.devLink });
          else toast.error(result.error);
        }),
      )}
    >
      <TextField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <Button type="submit" size="xl" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: { token, password: "", confirm: "" },
  });

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          const result = await resetPasswordAction(values);
          if (!result.ok) {
            setFormError(result.error);
            return;
          }
          toast.success("Password updated. Sign in with your new password.");
          router.replace(result.redirectTo ?? "/login");
        }),
      )}
    >
      <FormError message={formError} />
      <input type="hidden" {...register("token")} />
      <PasswordField label="New password" autoComplete="new-password" showStrength value={watch("password")} error={errors.password?.message} {...register("password")} />
      <PasswordField label="Confirm password" autoComplete="new-password" value={watch("confirm")} error={errors.confirm?.message} {...register("confirm")} />
      <Button type="submit" size="xl" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}
