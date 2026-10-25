import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import type { Agent } from "@/lib/data/types";
import { formatResponseTime } from "@/lib/format";
import { typeLabels } from "@/lib/labels";
import { initials } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils";

interface AgentCardProps {
  agent: Agent;
  agencyName: string | null;
  areaNames: string[];
  /** Match quiz extras. */
  score?: number;
  reasons?: string[];
  rank?: number;
  className?: string;
}

export function AgentCard({ agent: a, agencyName, areaNames, score, reasons, rank, className }: AgentCardProps) {
  return (
    <article className={cn("lift group relative flex h-full flex-col rounded-media border border-border bg-card p-6", className)}>
      <div className="flex items-start gap-4">
        {a.photo ? (
          <Image src={a.photo} alt="" width={64} height={64} className="size-16 rounded-full object-cover" />
        ) : (
          <span className="grid size-16 place-items-center rounded-full bg-secondary">{initials(a.name)}</span>
        )}
        <div className="min-w-0 flex-1">
          {rank && <p className="mono-label text-[0.6875rem] text-meta">#{rank} match</p>}
          <h3 className="flex items-center gap-1.5 text-lg leading-tight">
            <Link href={`/agents/${a.slug}`} className="after:absolute after:inset-0 after:rounded-media">{a.name}</Link>
            {a.verification === "verified" && <BadgeCheck className="size-4 shrink-0 text-brand dark:text-[#4cc3a4]" aria-label="Verified" />}
          </h3>
          <p className="truncate text-sm text-muted-foreground">{a.title}{agencyName ? ` · ${agencyName}` : " · Independent"}</p>
        </div>
        {score !== undefined && (
          <div className="text-right">
            <p className="tabular font-display text-3xl tracking-[-0.03em]">{score}%</p>
            <p className="text-xs text-muted-foreground">match</p>
          </div>
        )}
      </div>

      {score !== undefined && (
        <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-hairline" aria-hidden>
          <span className="absolute inset-0 origin-left rounded-full bg-[var(--chart-1)] transition-transform duration-700 ease-[var(--ease-out-quint)]" style={{ transform: `scaleX(${score / 100})` }} />
        </div>
      )}

      {reasons?.length ? (
        <ul className="mt-4 space-y-1.5 text-sm">
          {reasons.slice(0, 4).map((r) => <li key={r} className="flex gap-2"><span aria-hidden className="text-brand dark:text-[#4cc3a4]">✓</span>{r}</li>)}
        </ul>
      ) : (
        <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{a.bio}</p>
      )}

      <dl className="mt-auto grid grid-cols-3 gap-3 border-t border-border pt-4 text-sm">
        <div><dt className="text-xs text-muted-foreground">Rating</dt><dd className="flex items-center gap-1">{a.rating ? <><Star className="size-3.5 fill-current" aria-hidden />{a.rating.toFixed(1)}</> : "New"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Deals</dt><dd className="tabular">{a.dealsClosed}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Replies</dt><dd>{formatResponseTime(a.avgResponseMins).replace("within ", "")}</dd></div>
      </dl>
      <p className="mono-label mt-4 truncate text-[0.6875rem] text-meta">
        {a.specialties.map((s) => typeLabels[s]).join(" · ")}{areaNames.length ? ` — ${areaNames.join(", ")}` : ""}
      </p>
    </article>
  );
}
