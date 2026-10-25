import "server-only";
import { repo, type Listing, type Offer, type Viewing } from "@/lib/data";
import type { ManagedListing } from "@/components/features/manage/listing-manager";
import type { ViewingRow } from "@/components/features/manage/viewing-list";
import type { OfferRow } from "@/components/features/manage/offer-list";

/** Shapes repository records into the rows the dashboard components render. */

export async function nbNameMap() {
  return Object.fromEntries((await repo.neighbourhoods.list()).map((n) => [n.id, n.name]));
}

export async function managedListings(listings: Listing[], withAgent = false): Promise<ManagedListing[]> {
  const names = await nbNameMap();
  const agents = withAgent ? Object.fromEntries((await repo.agents.list()).map((a) => [a.id, a.name])) : {};
  return listings.map((l) => ({ ...l, neighbourhoodName: names[l.neighbourhoodId] ?? "", ...(withAgent && { agentName: l.agentId ? agents[l.agentId] ?? null : null }) }));
}

async function hostName(l: Listing | undefined) {
  if (!l) return "the lister";
  if (l.agentId) return (await repo.agents.findById(l.agentId))?.name ?? "the agent";
  return (l.ownerId && (await repo.users.findById(l.ownerId))?.name) || "the owner";
}

/** `host`: name the seeker. `seeker`: name whoever shows the home. */
export async function viewingRows(viewings: Viewing[], perspective: "host" | "seeker"): Promise<ViewingRow[]> {
  const listings = await repo.listings.findManyByIds([...new Set(viewings.map((v) => v.listingId))]);
  const people = await repo.users.findManyByIds([...new Set(viewings.map((v) => v.seekerId))]);
  return Promise.all(viewings.map(async (v) => {
    const l = listings.find((x) => x.id === v.listingId);
    return {
      viewing: v,
      listingId: v.listingId,
      listingTitle: l?.title ?? "Listing",
      personName: perspective === "host" ? people.find((p) => p.id === v.seekerId)?.name ?? "A seeker" : await hostName(l),
    };
  }));
}

export async function offerRows(offers: Offer[], perspective: "host" | "seeker"): Promise<OfferRow[]> {
  const listings = await repo.listings.findManyByIds([...new Set(offers.map((o) => o.listingId))]);
  const people = await repo.users.findManyByIds([...new Set(offers.map((o) => o.seekerId))]);
  return Promise.all(offers.map(async (o) => {
    const l = listings.find((x) => x.id === o.listingId);
    return {
      offer: o,
      listingId: o.listingId,
      listingTitle: l?.title ?? "Listing",
      asking: l?.price ?? o.amount,
      purpose: l?.purpose ?? "sale",
      personName: perspective === "host" ? people.find((p) => p.id === o.seekerId)?.name ?? "A seeker" : await hostName(l),
    };
  }));
}
