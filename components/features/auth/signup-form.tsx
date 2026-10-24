"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, KeyRound, Search } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { signupAction } from "@/app/(auth)/actions";
import { signupSchema, type SignupInput, SIGNUP_ROLES } from "@/lib/validation/auth";
import { cn } from "@/lib/utils";
import { FormError, PasswordField, TextField } from "./fields";

const ROLE_OPTIONS: Record<(typeof SIGNUP_ROLES)[number], { title: string; body: string; icon: typeof Search }> = {
  seeker: { title: "Find a home", body: "Rent or buy", icon: Search },
  owner: { title: "List my property", body: "Sell or let it", icon: KeyRound },
  agent: { title: "I'm an agent", body: "Manage leads", icon: Briefcase },
};

export function TermsField({ checked, onChange, error }: { checked: boolean; onChange: (v: boolean) => void; error?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
        <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} aria-invalid={!!error || undefined} className="mt-0.5" />
        <span>I agree to the Terms of Service and Privacy Policy.</span>
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function SignupForm({ defaultRole }: { defaultRole: SignupInput["role"] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, control, handleSubmit, watch, setError, formState: { errors } } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", password: "", role: defaultRole, terms: false },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await signupAction(values);
      if (!result.ok) {
        for (const [field, msgs] of Object.entries(result.fieldErrors ?? {})) {
          if (msgs?.[0]) setError(field as keyof SignupInput, { message: msgs[0] });
        }
        setFormError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Your account is ready");
      router.replace(result.redirectTo ?? "/");
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <FormError message={formError} />
      <Controller
        control={control}
        name="role"
        render={({ field }) => (
          <fieldset>
            <legend className="mb-2 text-sm">How will you use Nestly?</legend>
            <div role="radiogroup" className="grid grid-cols-3 gap-2">
              {SIGNUP_ROLES.map((r) => {
                const { title, body, icon: Icon } = ROLE_OPTIONS[r];
                const selected = field.value === r;
                return (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => field.onChange(r)}
                    className="relative flex flex-col items-start gap-1 rounded-xl border border-hairline p-3 text-left transition-colors hover:border-foreground/30"
                  >
                    {selected && (
                      <motion.span layoutId="signup-role" className="absolute -inset-px rounded-xl border-2 border-primary" transition={{ type: "spring", stiffness: 420, damping: 36 }} />
                    )}
                    <Icon className={cn("size-4", selected ? "text-foreground" : "text-meta")} strokeWidth={1.6} aria-hidden />
                    <span className="text-sm leading-tight">{title}</span>
                    <span className="text-xs text-muted-foreground">{body}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}
      />
      <TextField label="Full name" autoComplete="name" error={errors.name?.message} {...register("name")} />
      <TextField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <PasswordField label="Password" autoComplete="new-password" showStrength value={watch("password")} error={errors.password?.message} {...register("password")} />
      <Controller
        control={control}
        name="terms"
        render={({ field }) => <TermsField checked={field.value} onChange={field.onChange} error={errors.terms?.message} />}
      />
      <Button type="submit" size="xl" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Run an agency?{" "}
        <Link href="/signup/agency" className="text-link underline-offset-4 hover:underline">Register your agency</Link>
      </p>
    </form>
  );
}
