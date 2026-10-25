import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { repo, PROPERTY_TYPES } from "@/lib/data";
import { typeLabels } from "@/lib/labels";
import { AgentCard } from "@/components/features/directory/agent-card";
import { DirectoryFilters } from "@/components/features/directory/directory-filters";

export const metadata: Metadata = { title: "Agents", description: "Verified real estate agents in Lahore, by area, specialty and language." };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

const SORTS = { rating: "Top rated", deals: "Most deals", response: "Fastest reply" } as const;

export default async function AgentsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [agents, agencies, neighbourhoods] = await Promise.all([repo.agents.list(), repo.agencies.list(), repo.neighbourhoods.list()]);
  const areaNames = Object.fromEntries(neighbourhoods.map((n) => [n.id, n.name]));
  const agencyNames = Object.fromEntries(agencies.map((a) => [a.id, a.name]));

  const shown = agents
    .filter((a) => a.verification === "verified")
    .filter((a) => !sp.area || a.serviceAreas.includes(sp.area))
    .filter((a) => !sp.type || a.specialties.includes(sp.type as (typeof PROPERTY_TYPES)[number]))
    .filter((a) => !sp.purpose || a.purposes.includes(sp.purpose as "sale" | "rent"))
    .filter((a) => !sp.lang || a.languages.includes(sp.lang))
    .sort((a, b) =>
      sp.sort === "deals" ? b.dealsClosed - a.dealsClosed
      : sp.sort === "response" ? a.avgResponseMins - b.avgResponseMins
      : b.rating - a.rating || b.dealsClosed - a.dealsClosed);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mono-label text-meta">Directory</p>
          <h1 className="mt-3 text-5xl sm:text-6xl">Agents</h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">Every agent here is verified. Not sure who to pick? Let us match you.</p>
        </div>
        <Link href="/match" className="text-sm underline underline-offset-4">Take the matching quiz</Link>
      </header>

      <Suspense>
        <DirectoryFilters fields={[
          { name: "area", label: "All areas", options: [{ value: "", label: "" }, ...neighbourhoods.map((n) => ({ value: n.id, label: n.name }))] },
          { name: "type", label: "Any specialty", options: [{ value: "", label: "" }, ...PROPERTY_TYPES.map((t) => ({ value: t, label: typeLabels[t] }))] },
          { name: "purpose", label: "Sales & rentals", options: [{ value: "", label: "" }, { value: "sale", label: "Sales" }, { value: "rent", label: "Rentals" }] },
          { name: "lang", label: "Any language", options: [{ value: "", label: "" }, ...["Urdu", "English", "Punjabi"].map((l) => ({ value: l, label: l }))] },
          { name: "sort", label: "Top rated", options: [{ value: "", label: "" }, ...Object.entries(SORTS).slice(1).map(([value, label]) => ({ value, label }))] },
        ]} />
      </Suspense>

      <p className="mt-6 text-sm text-muted-foreground">{shown.length} agent{shown.length === 1 ? "" : "s"}</p>
      {shown.length ? (
        <ul className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((a) => (
            <li key={a.id}>
              <AgentCard agent={a} agencyName={a.agencyId ? agencyNames[a.agencyId] ?? null : null} areaNames={a.serviceAreas.map((x) => areaNames[x]).filter(Boolean)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 rounded-media border border-dashed border-hairline py-16 text-center text-muted-foreground">No agents match those filters.</p>
      )}
    </section>
  );
}
