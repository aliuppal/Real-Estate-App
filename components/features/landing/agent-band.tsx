import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { formatResponseTime } from "@/lib/format";
import { typeLabels } from "@/lib/labels";
import type { Agent } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { Reveal, Stagger, StaggerItem } from "./reveal";

/** Deep-green Cohere feature band promoting the agent-matching quiz. */
export function AgentBand({ agents, agencyNames }: { agents: Agent[]; agencyNames: Record<string, string> }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-12 rounded-media bg-brand px-6 py-14 text-brand-foreground sm:px-10 lg:grid-cols-[1fr_1.15fr] lg:p-20">
        <Reveal>
          <p className="mono-label mb-4 text-white/60">Agent matching</p>
          <h2 className="text-[2.25rem] leading-[1.1] sm:text-5xl sm:leading-[1.1]">Find the agent who already knows your street.</h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-white/75">
            Six questions about your goal, area, budget and timeline. We rank agents by fit and show you why each one made the list.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-6">
            <Link href="/match" className={cn(buttonVariants({ variant: "inverse", size: "xl" }))}>
              Take the 60-second quiz
            </Link>
            <Link href="/agents" className="group inline-flex items-center gap-2 text-sm underline underline-offset-4">
              Browse all agents
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
        </Reveal>

        <Stagger as="ul" className="space-y-3 self-center">
          {agents.map((a) => (
            <StaggerItem as="li" key={a.id}>
              <Link
                href={`/agents/${a.slug}`}
                className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:bg-white/[0.08] sm:p-5"
              >
                <Image src={a.photo} alt="" width={56} height={56} className="size-14 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg leading-tight">{a.name}</p>
                  <p className="truncate text-sm text-white/60">{a.agencyId ? agencyNames[a.agencyId] : "Independent"} · {a.yearsExperience} yrs</p>
                  <p className="mono-label mt-2 truncate text-[0.6875rem] text-white/50">
                    {a.specialties.map((s) => typeLabels[s]).join(" · ")}
                  </p>
                </div>
                <dl className="hidden shrink-0 grid-cols-3 gap-5 text-right sm:grid">
                  <div>
                    <dt className="text-[0.6875rem] text-white/50">Rating</dt>
                    <dd className="flex items-center justify-end gap-1"><Star className="size-3.5 fill-current" aria-hidden />{a.rating.toFixed(1)}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.6875rem] text-white/50">Deals</dt>
                    <dd className="tabular">{a.dealsClosed}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.6875rem] text-white/50">Replies</dt>
                    <dd className="whitespace-nowrap">{formatResponseTime(a.avgResponseMins).replace("within ", "")}</dd>
                  </div>
                </dl>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
