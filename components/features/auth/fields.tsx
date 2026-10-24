"use client";

import { forwardRef, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { passwordStrength } from "@/lib/validation/auth";
import { cn } from "@/lib/utils";

interface FieldProps extends React.ComponentProps<"input"> {
  label: string;
  error?: string;
  hint?: React.ReactNode;
}

const fieldInput = "h-12 rounded-lg border-input bg-background px-3.5 text-[0.95rem] focus-visible:border-[#9b60aa] focus-visible:ring-[#9b60aa]/20";

/** Label + input + inline error, wired with aria-invalid / aria-describedby. */
export const TextField = forwardRef<HTMLInputElement, FieldProps>(function TextField(
  { label, error, hint, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={inputId} className="font-normal">{label}</Label>
        {hint}
      </div>
      <Input
        ref={ref}
        id={inputId}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(fieldInput, className)}
        {...props}
      />
      {error && <p id={`${inputId}-error`} className="text-sm text-destructive">{error}</p>}
    </div>
  );
});

export const PasswordField = forwardRef<HTMLInputElement, FieldProps & { showStrength?: boolean; value?: string }>(
  function PasswordField({ label, error, hint, showStrength, value = "", id, ...props }, ref) {
    const autoId = useId();
    const inputId = id ?? autoId;
    const [visible, setVisible] = useState(false);
    const strength = passwordStrength(value);
    const describedBy = [error && `${inputId}-error`, showStrength && `${inputId}-strength`].filter(Boolean).join(" ");

    return (
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor={inputId} className="font-normal">{label}</Label>
          {hint}
        </div>
        <div className="relative">
          <Input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            aria-invalid={!!error || undefined}
            aria-describedby={describedBy || undefined}
            className={cn(fieldInput, "pr-12")}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-lg text-meta hover:text-foreground"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {showStrength && value.length > 0 && (
          <div id={`${inputId}-strength`} className="flex items-center gap-3" aria-live="polite">
            <div className="flex flex-1 gap-1" aria-hidden>
              {[1, 2, 3, 4].map((i) => (
                // Each segment fills via scaleX (compositor-only) rather than width.
                <span key={i} className="relative h-1 flex-1 overflow-hidden rounded-full bg-hairline">
                  <span
                    className={cn(
                      "absolute inset-0 origin-left transition-transform duration-300 ease-[var(--ease-out-quint)]",
                      strength.score <= 1 ? "bg-destructive" : strength.score === 2 ? "bg-cta" : "bg-success",
                    )}
                    style={{ transform: `scaleX(${strength.score >= i ? 1 : 0})` }}
                  />
                </span>
              ))}
            </div>
            <span className="mono-label w-20 text-right text-[0.6875rem] text-meta">{strength.label}</span>
          </div>
        )}
        {error && <p id={`${inputId}-error`} className="text-sm text-destructive">{error}</p>}
      </div>
    );
  },
);

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
      {message}
    </p>
  );
}
