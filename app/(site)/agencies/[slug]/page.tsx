import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BadgeCheck, Globe, Mail, Phone } from "lucide-react";
import { repo } from "@/lib/data";
import { AgencyMark } from "@/components/features/directory/agency-mark";
import { AgentCard } from "@/components/features/directory/agent-card";
import { Reviews } from "@/components/features/directory/reviews";
import { LazyAreasMap } from "@/components/features/directory/lazy-map";
import { PropertyCard } from "@/components/features/listings/property-card";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const agency = await repo.agencies.findBySlug((await params).slug);
  return agency ? { title: agency.name, description: agency.description } : { title: "Agency not found" };
}

export default async function AgencyProfilePage({ params }: Props) {
  const agency = await repo.agencies.findBySlug((await params).slug);
  if (!agency) notFound();
  const [team, listings, reviews, neighbourhoods] = await Promise.all([
    repo.agents.byAgency(agency.id), repo.listings.byAgency(agency.id), repo.reviews.forTarget("agency", agency.id), repo.neighbourhoods.list(),
  ]);
  const nbNames = Object.fromEntries(neighbourhoods.map((n) => [n.id, n.name]));
  const active = listings.filter((l) => l.status === "active" || l.status === "under_offer");
  const verifiedTeam = team.filter((a) => a.verification === "verified");

  return (
    <article className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {agency.cover && (
        <div className="relative mb-10 h-64 overflow-hidden rounded-media sm:h-80">
          <Image src={agency.cover} alt="" fill priority sizes="100vw" className="object-cover" />
        </div>
      )}
      <header className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="flex items-center gap-5">
          <AgencyMark name={agency.name} className="size-16 text-2xl" />
          <div>
            <h1 className="flex items-center gap-2 text-5xl">
              {agency.name}
              {agency.verification === "verified" && <BadgeCheck className="size-7 text-brand dark:text-[#4cc3a4]" aria-label="Verified" />}
            </h1>
            <p className="mt-2 text-muted-foreground">Since {agency.foundedYear} · {agency.serviceAreas.map((a) => nbNames[a]).join(", ")}</p>
          </div>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <li><a href={`tel:${agency.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 hover:underline"><Phone className="size-4" aria-hidden />{agency.phone}</a></li>
          <li><a href={`mailto:${agency.email}`} className="inline-flex items-center gap-2 hover:underline"><Mail className="size-4" aria-hidden />{agency.email}</a></li>
          {agency.website && <li><span className="inline-flex items-center gap-2 text-muted-foreground"><Globe className="size-4" aria-hidden />{agency.website.replace(/^https?:\/\//, "")}</span></li>}
        </ul>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-2">
        <p className="text-xl leading-relaxed">{agency.description || "This agency hasn't added a description yet."}</p>
        <div className="h-64 overflow-hidden rounded-media border border-border">
          <LazyAreasMap areas={neighbourhoods.filter((n) => agency.serviceAreas.includes(n.id)).map((n) => ({ id: n.id, name: n.name, center: n.center }))} />
        </div>
      </div>

      <section aria-labelledby="team" className="mt-16">
        <h2 id="team" className="mb-6 text-3xl">Team <span className="text-muted-foreground">({verifiedTeam.length})</span></h2>
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {verifiedTeam.map((a) => <li key={a.id}><AgentCard agent={a} agencyName={agency.name} areaNames={a.serviceAreas.map((x) => nbNames[x]).filter(Boolean)} /></li>)}
        </ul>
      </section>

      <section aria-labelledby="listings" className="mt-16">
        <h2 id="listings" className="mb-6 text-3xl">Listings <span className="text-muted-foreground">({active.length})</span></h2>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {active.map((l) => <li key={l.id}><PropertyCard listing={l} neighbourhoodName={nbNames[l.neighbourhoodId] ?? ""} className="h-full" /></li>)}
        </ul>
      </section>

      <section aria-labelledby="reviews" className="mt-16 border-t border-border pt-12">
        <h2 id="reviews" className="mb-8 text-3xl">Reviews</h2>
        <Reviews reviews={reviews} rating={agency.rating} />
      </section>
    </article>
  );
}
