import { cn } from "@/lib/utils";

/** Monogram used in place of uploaded agency logos. */
export function AgencyMark({ name, className }: { name: string; className?: string }) {
  const letters = name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
  return (
    <span aria-hidden className={cn("grid size-12 shrink-0 place-items-center rounded-xl bg-brand font-display text-lg tracking-[-0.02em] text-brand-foreground", className)}>
      {letters}
    </span>
  );
}
