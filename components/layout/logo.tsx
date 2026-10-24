import Link from "next/link";
import { cn } from "@/lib/utils";
import { site } from "@/config/site";

/** Wordmark with a roof-line mark. `currentColor` lets it sit on light, dark or brand surfaces. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label={`${site.name} home`} className={cn("group inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 32 32" aria-hidden className="size-6 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15.5 16 5l12 10.5" />
        <path d="M8 13v13h16V13" />
        <path d="M13 26v-6.5a3 3 0 0 1 6 0V26" className="transition-transform duration-300 ease-[var(--ease-out-quint)] group-hover:-translate-y-0.5" />
      </svg>
      <span className="font-heading text-[1.35rem] font-medium leading-none tracking-[-0.03em]">{site.name.toLowerCase()}</span>
    </Link>
  );
}
