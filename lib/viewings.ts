import "server-only";
import { repo, type Listing } from "@/lib/data";

/** Viewings that block the host's calendar: the agent's whole diary, or every listing of the owner. */
export async function bookedFor(listing: Listing) {
  if (listing.agentId) return repo.viewings.forAgent(listing.agentId);
  const ownerListings = listing.ownerId ? await repo.listings.byOwner(listing.ownerId) : [listing];
  return repo.viewings.forListings(ownerListings.map((l) => l.id));
}
