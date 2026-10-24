"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { agencySignupAction } from "@/app/(auth)/actions";
import { agencySignupSchema, type AgencySignupInput } from "@/lib/validation/auth";
import { FormError, PasswordField, TextField } from "./fields";
import { TermsField } from "./signup-form";

export function AgencySignupForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, control, handleSubmit, watch, setError, formState: { errors } } = useForm<AgencySignupInput>({
    resolver: zodResolver(agencySignupSchema),
    mode: "onTouched",
    defaultValues: { agencyName: "", name: "", email: "", phone: "", password: "", terms: false },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await agencySignupAction(values);
      if (!result.ok) {
        for (const [field, msgs] of Object.entries(result.fieldErrors ?? {})) {
          if (msgs?.[0]) setError(field as keyof AgencySignupInput, { message: msgs[0] });
        }
        setFormError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Agency registered");
      router.replace(result.redirectTo ?? "/");
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormError message={formError} />
      <TextField label="Agency name" autoComplete="organization" error={errors.agencyName?.message} {...register("agencyName")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Your name" autoComplete="name" error={errors.name?.message} {...register("name")} />
        <TextField label="Phone" type="tel" autoComplete="tel" placeholder="+92 42 …" error={errors.phone?.message} {...register("phone")} />
      </div>
      <TextField label="Work email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <PasswordField label="Password" autoComplete="new-password" showStrength value={watch("password")} error={errors.password?.message} {...register("password")} />
      <Controller
        control={control}
        name="terms"
        render={({ field }) => <TermsField checked={field.value} onChange={field.onChange} error={errors.terms?.message} />}
      />
      <Button type="submit" size="xl" className="w-full" disabled={pending}>
        {pending ? "Registering…" : "Register agency"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        New agencies are reviewed by our team before their listings show a verified badge.
      </p>
    </form>
  );
}
