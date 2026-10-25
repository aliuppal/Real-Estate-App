import Link from "next/link";
import { SearchX } from "lucide-react";
import type { MatchResult } from "@/lib/matching";
import { AgentCard } from "@/components/features/directory/agent-card";
import { ContactAgentButton } from "@/components/features/directory/contact-agent-button";
import { Stagger, StaggerItem } from "@/components/features/landing/reveal";

interface MatchResultsProps {
  results: MatchResult[];
  summary: string[];
  editHref: string;
  agencyNames: Record<string, string>;
  areaNames: Record<string, string>;
  signedIn: boolean;
  draft: string;
}

export function MatchResults({ results, summary, editHref, agencyNames, areaNames, signedIn, draft }: MatchResultsProps) {
  return (
    <div>
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mono-label text-meta">Your matches</p>
          <h1 className="mt-3 text-5xl sm:text-6xl">{results.length ? "Agents who fit your move" : "No exact matches"}</h1>
          <div className="mt-5 flex flex-wrap gap-2">
            {summary.map((s) => <span key={s} className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">{s}</span>)}
          </div>
        </div>
        <Link href={editHref} className="text-sm underline underline-offset-4">Change answers</Link>
      </header>

      {results.length ? (
        <Stagger className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {results.map((r, i) => (
            <StaggerItem key={r.agent.id} className="flex flex-col gap-3">
              <AgentCard agent={r.agent} rank={i + 1} score={r.score} reasons={r.reasons}
                agencyName={r.agent.agencyId ? agencyNames[r.agent.agencyId] ?? null : null}
                areaNames={r.agent.serviceAreas.map((a) => areaNames[a]).filter(Boolean)} />
              <ContactAgentButton agentId={r.agent.id} agentName={r.agent.name} signedIn={signedIn} draft={draft} variant={i === 0 ? "default" : "outline"} className="w-full" />
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <div className="flex flex-col items-center rounded-media border border-dashed border-hairline py-16 text-center">
          <SearchX className="size-8 text-meta" strokeWidth={1.4} aria-hidden />
          <p className="mt-4 max-w-sm text-muted-foreground">No verified agent covers that combination yet. Try “Anywhere in Lahore” or a wider budget.</p>
          <Link href={editHref} className="mt-6 underline underline-offset-4">Change answers</Link>
        </div>
      )}
      <p className="mt-10 text-sm text-meta">
        Scores weigh area (25), budget fit (20), property specialty (15), track record (15), language (10), response time (10) and rating (5).
        Urgent moves weigh response time more.
      </p>
    </div>
  );
}
