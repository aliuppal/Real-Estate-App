import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mono-label text-meta">{eyebrow}</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function StatCard({ label, value, hint, href }: { label: string; value: string | number; hint?: string; href?: string }) {
  const body = (
    <>
      <p className="mono-label text-[0.6875rem] text-meta">{label}</p>
      <p className="tabular mt-4 font-display text-4xl tracking-[-0.03em]">{value}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </>
  );
  const box = "rounded-xl border border-border bg-card p-5";
  return href ? (
    <Link href={href} className={cn(box, "lift transition-colors hover:border-hairline")}>{body}</Link>
  ) : (
    <div className={box}>{body}</div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

export function Panel({ title, href, linkLabel = "View all", children, className }: { title: string; href?: string; linkLabel?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-border bg-card", className)}>
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-lg">{title}</h2>
        {href && (
          <Link href={href} className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            {linkLabel} <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
          </Link>
        )}
      </div>
      <div className="p-2">{children}</div>
    </section>
  );
}

export function EmptyRow({ children }: { children: React.ReactNode }) {
  return <p className="px-3 py-6 text-center text-sm text-muted-foreground">{children}</p>;
}

export function Row({ title, meta, aside, href }: { title: string; meta?: string; aside?: React.ReactNode; href?: string }) {
  const inner = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{title}</span>
        {meta && <span className="block truncate text-xs text-muted-foreground">{meta}</span>}
      </span>
      {aside && <span className="shrink-0 text-right text-sm">{aside}</span>}
    </>
  );
  const cls = "flex items-center gap-4 rounded-lg px-3 py-2.5";
  return href ? <Link href={href} className={cn(cls, "hover:bg-muted")}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

const STATUS_TONE: Record<string, string> = {
  active: "bg-brand-soft text-brand dark:text-[#9fe8c8]",
  confirmed: "bg-brand-soft text-brand dark:text-[#9fe8c8]",
  verified: "bg-brand-soft text-brand dark:text-[#9fe8c8]",
  accepted: "bg-brand-soft text-brand dark:text-[#9fe8c8]",
  pending: "bg-secondary text-secondary-foreground",
  requested: "bg-secondary text-secondary-foreground",
  submitted: "bg-secondary text-secondary-foreground",
  reviewing: "bg-secondary text-secondary-foreground",
  draft: "bg-secondary text-secondary-foreground",
  under_offer: "bg-cta/15 text-[#a3402a] dark:text-cta",
  open: "bg-cta/15 text-[#a3402a] dark:text-cta",
  rejected: "bg-destructive/10 text-destructive",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn("mono-label rounded-full px-2 py-0.5 text-[0.625rem]", STATUS_TONE[status] ?? "bg-muted text-muted-foreground")}>
      {status.replace("_", " ")}
    </span>
  );
}
