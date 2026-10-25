import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { repo } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth/session";
import { formatPrice, formatResponseTime } from "@/lib/format";
import { typeLabels } from "@/lib/labels";
import { initials } from "@/components/layout/user-menu";
import { PropertyCard } from "@/components/features/listings/property-card";
import { ContactAgentButton } from "@/components/features/directory/contact-agent-button";
import { Reviews } from "@/components/features/directory/reviews";
import { LazyAreasMap } from "@/components/features/directory/lazy-map";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const agent = await repo.agents.findBySlug((await params).slug);
  return agent ? { title: `${agent.name}, ${agent.title}`, description: agent.bio } : { title: "Agent not found" };
}

export default async function AgentProfilePage({ params }: Props) {
  const agent = await repo.agents.findBySlug((await params).slug);
  if (!agent) notFound();
  const [agency, listings, reviews, neighbourhoods, user] = await Promise.all([
    agent.agencyId ? repo.agencies.findById(agent.agencyId) : null,
    repo.listings.byAgent(agent.id),
    repo.reviews.forTarget("agent", agent.id),
    repo.neighbourhoods.list(),
    getCurrentUser(),
  ]);
  const active = listings.filter((l) => l.status === "active" || l.status === "under_offer");
  const nbNames = Object.fromEntries(neighbourhoods.map((n) => [n.id, n.name]));
  const areas = neighbourhoods.filter((n) => agent.serviceAreas.includes(n.id));

  const stats = [
    { label: "Deals closed", value: String(agent.dealsClosed) },
    { label: "Rating", value: agent.rating ? `${agent.rating.toFixed(1)} / 5` : "New" },
    { label: "Usually replies", value: formatResponseTime(agent.avgResponseMins).replace("within ", "in ") },
    { label: "Experience", value: `${agent.yearsExperience} yr${agent.yearsExperience === 1 ? "" : "s"}` },
  ];

  return (
    <article className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="flex flex-wrap items-center gap-6">
          {agent.photo ? (
            <Image src={agent.photo} alt="" width={120} height={120} priority className="size-28 rounded-full object-cover" />
          ) : (
            <span className="grid size-28 place-items-center rounded-full bg-secondary text-2xl">{initials(agent.name)}</span>
          )}
          <div>
            <p className="mono-label text-meta">{agent.title}</p>
            <h1 className="mt-2 flex items-center gap-2 text-5xl">
              {agent.name}
              {agent.verification === "verified" && <BadgeCheck className="size-7 text-brand dark:text-[#4cc3a4]" aria-label="Verified" />}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {agency ? <Link href={`/agencies/${agency.slug}`} className="underline-offset-4 hover:underline">{agency.name}</Link> : "Independent"}
              {" · "}{agent.languages.join(", ")}
            </p>
          </div>
        </div>
        {agent.verification === "verified" && <ContactAgentButton agentId={agent.id} agentName={agent.name} signedIn={!!user} />}
      </header>

      <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card p-5">
            <dt className="text-sm text-muted-foreground">{s.label}</dt>
            <dd className="tabular mt-2 font-display text-3xl tracking-[-0.03em]">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_1fr]">
        <section aria-labelledby="about">
          <h2 id="about" className="mb-4 text-3xl">About</h2>
          <p className="text-lg leading-relaxed">{agent.bio || "This agent hasn't written a bio yet."}</p>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex gap-3"><dt className="w-28 text-muted-foreground">Specialises in</dt><dd>{agent.specialties.map((s) => typeLabels[s]).join(", ")}</dd></div>
            <div className="flex gap-3"><dt className="w-28 text-muted-foreground">Handles</dt><dd>{agent.purposes.map((p) => (p === "sale" ? "Sales" : "Rentals")).join(" and ")}</dd></div>
            {Object.entries(agent.priceBands).map(([purpose, band]) => (
              <div key={purpose} className="flex gap-3"><dt className="w-28 text-muted-foreground">{purpose === "sale" ? "Sale range" : "Rent range"}</dt>
                <dd className="tabular">{formatPrice(band.min, { compact: true })} – {formatPrice(band.max, { compact: true, purpose: purpose as "sale" | "rent" })}</dd></div>
            ))}
          </dl>
        </section>
        <section aria-labelledby="areas">
          <h2 id="areas" className="mb-4 text-3xl">Areas covered</h2>
          <div className="h-72 overflow-hidden rounded-media border border-border">
            <LazyAreasMap areas={areas.map((a) => ({ id: a.id, name: a.name, center: a.center }))} />
          </div>
        </section>
      </div>

      <section aria-labelledby="listings" className="mt-16">
        <h2 id="listings" className="mb-6 text-3xl">Active listings <span className="text-muted-foreground">({active.length})</span></h2>
        {active.length ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {active.map((l) => <li key={l.id}><PropertyCard listing={l} neighbourhoodName={nbNames[l.neighbourhoodId] ?? ""} className="h-full" /></li>)}
          </ul>
        ) : <p className="text-muted-foreground">No active listings right now.</p>}
      </section>

      <section aria-labelledby="reviews" className="mt-16 border-t border-border pt-12">
        <h2 id="reviews" className="mb-8 text-3xl">Reviews</h2>
        <Reviews reviews={reviews} rating={agent.rating} />
      </section>
    </article>
  );
}
