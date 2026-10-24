import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Hammer } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ComingSoonProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  backHref?: string;
  backLabel?: string;
}

/** Placeholder for routes that are wired up and protected but built in Phase 2. */
export function ComingSoon({ title, description, icon: Icon = Hammer, backHref = "/", backLabel = "Back to home" }: ComingSoonProps) {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <span className="mb-6 grid size-14 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
        <Icon className="size-6" aria-hidden />
      </span>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Arriving in Phase 2</p>
      <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
      <p className="mt-3 text-muted-foreground">{description}</p>
      <Link href={backHref} className={cn(buttonVariants({ variant: "outline", size: "xl" }), "mt-8")}>
        {backLabel}
      </Link>
    </section>
  );
}
