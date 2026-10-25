import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import { repo } from "@/lib/data";
import { AgencyMark } from "@/components/features/directory/agency-mark";

export const metadata: Metadata = { title: "Agencies", description: "Verified real estate agencies in Lahore with their teams, listings and reviews." };

export default async function AgenciesPage() {
  const [agencies, agents, listings, neighbourhoods] = await Promise.all([
    repo.agencies.list(), repo.agents.list(), repo.listings.all(), repo.neighbourhoods.list(),
  ]);
  const nbNames = Object.fromEntries(neighbourhoods.map((n) => [n.id, n.name]));
  const verified = agencies.filter((a) => a.verification === "verified").sort((a, b) => b.rating - a.rating);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mono-label text-meta">Directory</p>
          <h1 className="mt-3 text-5xl sm:text-6xl">Agencies</h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">Established teams with verified agents and reviewed track records.</p>
        </div>
        <Link href="/signup/agency" className="text-sm underline underline-offset-4">Register your agency</Link>
      </header>
      <ul className="grid gap-5 md:grid-cols-2">
        {verified.map((ag) => {
          const team = agents.filter((a) => a.agencyId === ag.id);
          const live = listings.filter((l) => l.agencyId === ag.id && l.status === "active").length;
          return (
            <li key={ag.id}>
              <article className="lift group relative flex h-full flex-col rounded-media border border-border bg-card p-6">
                <div className="flex items-center gap-4">
                  <AgencyMark name={ag.name} />
                  <div className="min-w-0">
                    <h2 className="flex items-center gap-1.5 text-xl">
                      <Link href={`/agencies/${ag.slug}`} className="after:absolute after:inset-0 after:rounded-media">{ag.name}</Link>
                      <BadgeCheck className="size-4 text-brand dark:text-[#4cc3a4]" aria-label="Verified" />
                    </h2>
                    <p className="text-sm text-muted-foreground">Since {ag.foundedYear} · {ag.serviceAreas.map((a) => nbNames[a]).join(", ")}</p>
                  </div>
                </div>
                <p className="mt-4 text-muted-foreground">{ag.description}</p>
                <dl className="mt-auto grid grid-cols-3 gap-3 border-t border-border pt-4 text-sm">
                  <div><dt className="text-xs text-muted-foreground">Agents</dt><dd className="tabular">{team.length}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Live listings</dt><dd className="tabular">{live}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Rating</dt><dd className="flex items-center gap-1"><Star className="size-3.5 fill-current" aria-hidden />{ag.rating.toFixed(1)} ({ag.reviewCount})</dd></div>
                </dl>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
