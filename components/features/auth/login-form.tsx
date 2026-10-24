"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/app/(auth)/actions";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { FormError, PasswordField, TextField } from "./fields";
import { DemoAccounts } from "./demo-accounts";

interface LoginFormProps {
  callbackUrl?: string;
  showDemo: boolean;
  googleAction?: () => Promise<void>;
}

export function LoginForm({ callbackUrl, showDemo, googleAction }: LoginFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setValue, setFocus, watch, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await loginAction(values, callbackUrl);
      if (!result.ok) {
        setFormError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Welcome back");
      router.replace(result.redirectTo ?? "/");
      router.refresh();
    });
  });

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError message={formError} />
        <TextField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          value={watch("password")}
          hint={<Link href="/forgot-password" className="text-sm text-link underline-offset-4 hover:underline">Forgot password?</Link>}
          {...register("password")}
        />
        <Button type="submit" size="xl" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {googleAction && (
        <form action={googleAction}>
          <Button type="submit" variant="outline" size="xl" className="w-full">Continue with Google</Button>
        </form>
      )}

      {showDemo && (
        <DemoAccounts
          onPick={(email, password) => {
            setValue("email", email, { shouldValidate: true });
            setValue("password", password, { shouldValidate: true });
            setFormError(null);
            setFocus("password");
          }}
        />
      )}
    </div>
  );
}
