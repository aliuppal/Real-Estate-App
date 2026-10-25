import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { cache } from "react";
import { site } from "@/config/site";
import { ChevronRight } from "lucide-react";
import { repo, type Listing, type PublicUser } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageListing } from "@/lib/auth/action";
import { bookedFor } from "@/lib/viewings";
import { viewingSlots } from "@/lib/availability";
import { nearbyPlaces } from "@/lib/nearby";
import { TYPE_FACTOR, vsNeighbourhood } from "@/lib/pricing";
import { formatPrice, formatRelativeDate } from "@/lib/format";
import { typeLabels } from "@/lib/labels";
import { Gallery } from "@/components/features/listing/gallery";
import { Amenities, KeyFacts, NeighbourhoodScores } from "@/components/features/listing/facts";
import { Location } from "@/components/features/listing/location";
import { PriceHistory } from "@/components/features/listing/price-history";
import { MortgageCalculator, MoveInCalculator, RentVsBuy } from "@/components/features/listing/calculators";
import { ContactCard, type PublicContact } from "@/components/features/listing/contact-card";
import { ListingActions } from "@/components/features/listing/listing-actions";
import { RecentlyViewed, RecordView } from "@/components/features/listing/recently-viewed";
import { PropertyCard } from "@/components/features/listings/property-card";

type Props = { params: Promise<{ id: string }> };

const isPublic = (l: Listing) => l.status === "active" || l.status === "under_offer";

/** Deduplicated per request: metadata, the OG image and the page all need the same listing. */
const load = cache(async (id: string) => (await repo.listings.findById(id)) ?? (await repo.listings.findBySlug(id)));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = await load((await params).id);
  if (!l || !isPublic(l)) return { title: "Listing not found" };
  const description = `${formatPrice(l.price, { compact: true, purpose: l.purpose })} · ${l.address}. ${l.description.slice(0, 120)}`;
  // The preview image comes from ./opengraph-image.tsx.
  return {
    title: l.title,
    description,
    alternates: { canonical: `/listings/${l.id}` },
    openGraph: { title: l.title, description, type: "website", url: `/listings/${l.id}` },
    twitter: { card: "summary_large_image", title: l.title, description },
  };
}

async function publicContact(l: Listing): Promise<PublicContact | null> {
  if (l.agentId) {
    const agent = await repo.agents.findById(l.agentId);
    if (!agent) return null;
    const agency = agent.agencyId ? await repo.agencies.findById(agent.agencyId) : null;
    return {
      kind: "agent", name: agent.name, photo: agent.photo || null, subtitle: `${agent.title}${agency ? ` · ${agency.name}` : ""}`,
      verified: agent.verification === "verified", responseMins: agent.avgResponseMins, rating: agent.rating || null,
      reviewCount: agent.reviewCount, phone: agent.phone || null, profileHref: `/agents/${agent.slug}`,
    };
  }
  const owner = l.ownerId ? await repo.users.findById(l.ownerId) : null;
  if (!owner) return null;
  return { kind: "owner", name: owner.name, photo: owner.avatar, subtitle: "Owner · listing privately", verified: false, responseMins: null, rating: null, reviewCount: 0, phone: owner.phone, profileHref: null };
}

function listingJsonLd(l: Listing, area: string) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: l.title,
    description: l.description,
    url: `${site.url}/listings/${l.id}`,
    image: l.images.slice(0, 5),
    datePosted: l.createdAt,
    offers: { "@type": "Offer", price: l.price, priceCurrency: "PKR", availability: l.status === "active" ? "https://schema.org/InStock" : "https://schema.org/LimitedAvailability" },
    about: {
      "@type": l.type === "apartment" ? "Apartment" : l.type === "house" || l.type === "villa" ? "House" : "Place",
      address: { "@type": "PostalAddress", streetAddress: l.address, addressLocality: area, addressRegion: "Punjab", addressCountry: "PK" },
      geo: { "@type": "GeoCoordinates", latitude: l.location.lat, longitude: l.location.lng },
      ...(l.beds ? { numberOfRooms: l.beds } : {}),
      floorSize: { "@type": "QuantitativeValue", value: l.areaSqft, unitCode: "FTK" },
    },
  };
}

const MANAGE_HREF: Partial<Record<PublicUser["role"], string>> = {
  owner: "/dashboard/owner/listings", agent: "/dashboard/agent/listings", agency_admin: "/dashboard/agency/listings", admin: "/dashboard/admin/moderation",
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-border pt-10">
      <h2 id={id} className="mb-6 text-2xl sm:text-3xl">{title}</h2>
      {children}
    </section>
  );
}

export default async function ListingPage({ params }: Props) {
  const listing = await load((await params).id);
  if (!listing) notFound();
  const user = await getCurrentUser();
  const manages = !!user && canManageListing(user, listing);
  if (!isPublic(listing) && !manages) notFound();
  // Count the view after the response is sent, so it never delays the page.
  if (!manages) after(() => repo.listings.recordView(listing.id));

  const [neighbourhood, neighbourhoods, contact, similar, booked] = await Promise.all([
    repo.neighbourhoods.findById(listing.neighbourhoodId),
    repo.neighbourhoods.list(),
    publicContact(listing),
    repo.listings.similar(listing, 4),
    bookedFor(listing),
  ]);
  if (!neighbourhood) notFound();
  const nbNames = Object.fromEntries(neighbourhoods.map((n) => [n.id, n.name]));
  const perSqft = vsNeighbourhood(listing, neighbourhood);
  const factor = TYPE_FACTOR[listing.type];
  const isOwn = manages && user?.role !== "admin";

  return (
    <article className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        // Structured data for search engines; escaped so listing text can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd(listing, neighbourhood.name)).replace(/</g, "\\u003c") }}
      />
      <RecordView listingId={listing.id} />
      {!isPublic(listing) && (
        <p role="status" className="mb-6 rounded-lg bg-secondary px-4 py-3 text-sm">
          This listing is <strong className="font-medium">{listing.status.replace("_", " ")}</strong> and only visible to you.
        </p>
      )}

      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/search" className="hover:text-foreground">Search</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link href={`/search?neighbourhoodIds=${neighbourhood.id}`} className="hover:text-foreground">{neighbourhood.name}</Link>
      </nav>

      <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-3xl">
          <p className="mono-label text-meta">{typeLabels[listing.type]} · {listing.purpose === "rent" ? "For rent" : "For sale"} · Listed {formatRelativeDate(listing.createdAt)}</p>
          <h1 className="mt-3 text-4xl leading-[1.05] sm:text-5xl">{listing.title}</h1>
          <p className="mt-3 text-muted-foreground">{listing.address}</p>
        </div>
        <ListingActions listingId={listing.id} title={listing.title} signedIn={!!user} />
      </header>

      <Gallery images={listing.images} title={listing.title} floorPlan={listing.floorPlan} videoUrl={listing.videoUrl} />

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-10">
          <KeyFacts listing={listing} />
          <section aria-labelledby="about">
            <h2 id="about" className="mb-4 text-2xl sm:text-3xl">About this home</h2>
            <p className="max-w-prose whitespace-pre-line text-[1.0625rem] leading-relaxed">{listing.description}</p>
          </section>
          {listing.amenities.length > 0 && <Section id="amenities" title="Amenities"><Amenities amenities={listing.amenities} /></Section>}
          <Section id="location" title="Location">
            <Location location={listing.location} places={nearbyPlaces(listing.id, listing.location)} address={listing.address} title={listing.title} />
          </Section>
          <Section id="price" title="Price history">
            <PriceHistory history={listing.priceHistory} purpose={listing.purpose} perSqft={{ ...perSqft, neighbourhood: neighbourhood.name }} />
          </Section>
          <Section id="costs" title={listing.purpose === "sale" ? "Mortgage calculator" : "Move-in costs"}>
            {listing.purpose === "sale" ? (
              <MortgageCalculator price={listing.price} />
            ) : (
              <MoveInCalculator rent={listing.price} depositMonths={listing.depositMonths ?? 2} advanceMonths={listing.advanceMonths ?? 1} agentListed={listing.listedBy === "agent"} />
            )}
          </Section>
          {listing.type !== "plot" && listing.type !== "commercial" && (
            <Section id="rent-vs-buy" title="Rent or buy?">
              <RentVsBuy purpose={listing.purpose} price={listing.price}
                estimatedRent={Math.round(neighbourhood.avgRentPerSqft * factor * listing.areaSqft)}
                estimatedPrice={Math.round(neighbourhood.avgSalePerSqft * factor * listing.areaSqft)} />
            </Section>
          )}
          <Section id="neighbourhood" title={`Living in ${neighbourhood.name}`}><NeighbourhoodScores neighbourhood={neighbourhood} /></Section>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <ContactCard
            listingId={listing.id}
            listingTitle={listing.title}
            purpose={listing.purpose}
            price={listing.price}
            depositMonths={listing.depositMonths}
            contact={contact}
            viewer={{ signedIn: !!user, role: user?.role ?? null, isOwn, manageHref: user ? MANAGE_HREF[user.role] ?? null : null }}
            slots={viewingSlots(booked, 7)}
          />
          <p className="mt-3 text-center text-xs text-meta">{listing.views.toLocaleString("en-PK")} views · {listing.saves} saves</p>
        </div>
      </div>

      {similar.length > 0 && (
        <section aria-labelledby="similar" className="mt-20">
          <h2 id="similar" className="mb-6 text-3xl">Similar homes</h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((l) => <li key={l.id}><PropertyCard listing={l} neighbourhoodName={nbNames[l.neighbourhoodId] ?? ""} className="h-full" /></li>)}
          </ul>
        </section>
      )}
      <div className="mt-20">
        <RecentlyViewed excludeId={listing.id} nbNames={nbNames} />
      </div>
    </article>
  );
}
