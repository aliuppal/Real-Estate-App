import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PropertyCard } from "@/components/features/listings/property-card";
import { Hero } from "@/components/features/landing/hero";
import { StatRow } from "@/components/features/landing/stat-counter";
import { ListingCarousel } from "@/components/features/landing/listing-carousel";
import { AgentBand } from "@/components/features/landing/agent-band";
import { HowItWorks } from "@/components/features/landing/how-it-works";
import { MortgageTeaser } from "@/components/features/landing/mortgage-teaser";
import { Testimonials } from "@/components/features/landing/testimonials";
import { SectionHeading } from "@/components/features/landing/section-heading";
import { Reveal, Stagger, StaggerItem } from "@/components/features/landing/reveal";
import { repo } from "@/lib/data";
import { locale } from "@/config/locale";
import { typeLabels } from "@/lib/labels";
import { unsplash } from "@/lib/images";
import { cn } from "@/lib/utils";

const container = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
const viewAll = "group inline-flex items-center gap-2 text-sm underline underline-offset-4";

export default async function HomePage() {
  const [featured, fresh, neighbourhoods, counts, agents, agencies, stats] = await Promise.all([
    repo.listings.featured(10),
    repo.listings.newSince(7, 4),
    repo.neighbourhoods.list(),
    repo.neighbourhoods.listingCounts(),
    repo.agents.list(),
    repo.agencies.list(),
    repo.stats.platform(),
  ]);

  const nbName = Object.fromEntries(neighbourhoods.map((n) => [n.id, n.name]));
  const agencyNames = Object.fromEntries(agencies.map((a) => [a.id, a.name]));
  const verifiedAgents = agents.filter((a) => a.verification === "verified");
  const fastest = [...verifiedAgents].sort((a, b) => a.avgResponseMins - b.avgResponseMins).slice(0, 3);
  const topRated = [...verifiedAgents].sort((a, b) => b.rating - a.rating || b.dealsClosed - a.dealsClosed).slice(0, 3);
  const [bigNb, ...otherNbs] = [...neighbourhoods].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));

  return (
    <>
      <Hero
        liveCount={stats.activeListings}
        city={locale.city}
        image={unsplash("1600596542815-ffad4c1539a9", 2000)}
        places={neighbourhoods.map((n) => ({ id: n.id, name: n.name, count: counts[n.id] ?? 0 }))}
        agents={fastest.map((a) => ({
          slug: a.slug,
          name: a.name,
          photo: a.photo,
          agency: a.agencyId ? agencyNames[a.agencyId] : "Independent",
          rating: a.rating,
          responseMins: a.avgResponseMins,
          specialty: typeLabels[a.specialties[0]],
        }))}
      />

      <section className={cn(container, "pb-24")}>
        <StatRow
          stats={[
            { value: stats.activeListings, label: "Homes live now" },
            { value: verifiedAgents.length, label: "Verified agents" },
            { value: agents.reduce((sum, a) => sum + a.dealsClosed, 0), label: "Deals closed by our agents" },
            { value: neighbourhoods.length, label: "Neighbourhoods covered" },
          ]}
        />
      </section>

      <section aria-label="Partner agencies" className={cn(container, "pb-28 text-center")}>
        <p className="mono-label text-meta">Working with Lahore&apos;s leading agencies</p>
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-14 gap-y-6">
          {agencies.filter((a) => a.verification === "verified").map((a) => (
            <li key={a.id}>
              <Link href={`/agencies/${a.slug}`} className="font-display text-2xl tracking-[-0.03em] text-meta transition-colors hover:text-foreground">
                {a.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={cn(container, "pb-28")}>
        <SectionHeading
          eyebrow="Most saved this month"
          title="Homes people keep coming back to"
          action={<Link href="/search?sort=most_viewed" className={viewAll}>View all <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden /></Link>}
        />
        <ListingCarousel label="Most saved listings" items={featured.map((l) => ({ listing: l, neighbourhoodName: nbName[l.neighbourhoodId] ?? "" }))} />
      </section>

      <section className={cn(container, "pb-28")}>
        <SectionHeading eyebrow="Neighbourhoods" title="Five corners of Lahore, each with its own pace" />
        <Stagger className="grid gap-4 md:grid-cols-4 md:grid-rows-2">
          {[bigNb, ...otherNbs].map((n, i) => (
            <StaggerItem key={n.id} className={cn(i === 0 && "md:col-span-2 md:row-span-2")}>
              <Link
                href={`/search?neighbourhoodIds=${n.id}`}
                className={cn("group relative flex h-full min-h-64 overflow-hidden rounded-media bg-muted", i === 0 && "md:min-h-[540px]")}
              >
                <Image
                  src={n.image}
                  alt=""
                  fill
                  sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 100vw"}
                  className="object-cover transition-transform duration-[900ms] ease-[var(--ease-out-quint)] group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden />
                <div className="relative mt-auto w-full p-5 text-white sm:p-6">
                  <p className="mono-label text-white/70">{counts[n.id] ?? 0} homes · Safety {n.scores.safety}</p>
                  <h3 className={cn("mt-2 leading-tight", i === 0 ? "text-3xl sm:text-4xl" : "text-2xl")}>{n.name}</h3>
                  {i === 0 && <p className="mt-2 max-w-md text-white/80">{n.description}</p>}
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {fresh.length > 0 && (
        <section className={cn(container, "pb-28")}>
          <SectionHeading
            eyebrow="New this week"
            title="Fresh on the market"
            action={<Link href="/search?listedWithinDays=7" className={viewAll}>See everything new <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden /></Link>}
          />
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {fresh.map((l) => (
              <StaggerItem key={l.id}>
                <PropertyCard listing={l} neighbourhoodName={nbName[l.neighbourhoodId] ?? ""} className="h-full" />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}

      <div className="pb-28">
        <AgentBand agents={topRated} agencyNames={agencyNames} />
      </div>

      <section className={cn(container, "pb-28")}>
        <SectionHeading eyebrow="How it works" title="Three steps, whichever side of the deal you're on" />
        <Reveal>
          <HowItWorks />
        </Reveal>
      </section>

      <section className={cn(container, "pb-28")}>
        <Reveal>
          <MortgageTeaser />
        </Reveal>
      </section>

      <section className={cn(container, "pb-32")}>
        <SectionHeading eyebrow="Stories" title="Moves that went the way people hoped" />
        <Testimonials />
      </section>
    </>
  );
}
