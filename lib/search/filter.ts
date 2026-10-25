import type { Listing, SearchFilters, SortKey } from "@/lib/data/types";

/** Ray-casting point-in-polygon. Polygon vertices are [lat, lng]. */
export function pointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    const crosses = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

export const pricePerSqft = (l: Pick<Listing, "price" | "areaSqft">) => (l.areaSqft ? l.price / l.areaSqft : 0);

/**
 * Pure, in-memory filter used by the mock repository. The Drizzle implementation translates the same
 * `SearchFilters` into SQL, so behaviour here is the reference.
 */
export function matchesFilters(l: Listing, f: SearchFilters, now = Date.now()): boolean {
  if (f.purpose && l.purpose !== f.purpose) return false;
  if (f.types?.length && !f.types.includes(l.type)) return false;
  if (f.neighbourhoodIds?.length && !f.neighbourhoodIds.includes(l.neighbourhoodId)) return false;
  if (f.minPrice != null && l.price < f.minPrice) return false;
  if (f.maxPrice != null && l.price > f.maxPrice) return false;
  if (f.minBeds != null && l.beds < f.minBeds) return false;
  if (f.minBaths != null && l.baths < f.minBaths) return false;
  if (f.minAreaSqft != null && l.areaSqft < f.minAreaSqft) return false;
  if (f.maxAreaSqft != null && l.areaSqft > f.maxAreaSqft) return false;
  if (f.furnished && !l.furnished) return false;
  if (f.petsAllowed && !l.petsAllowed) return false;
  if (f.parking && l.parking < 1) return false;
  if (f.amenities?.length && !f.amenities.every((a) => l.amenities.includes(a))) return false;
  if (f.listedBy && l.listedBy !== f.listedBy) return false;
  if (f.verifiedOnly && !l.verified) return false;
  if (f.listedWithinDays != null && now - new Date(l.createdAt).getTime() > f.listedWithinDays * 86_400_000) return false;
  if (f.polygon && f.polygon.length >= 3 && !pointInPolygon(l.location.lat, l.location.lng, f.polygon)) return false;
  if (f.q) {
    const haystack = `${l.title} ${l.address} ${l.description}`.toLowerCase();
    if (!f.q.toLowerCase().split(/\s+/).filter(Boolean).every((word) => haystack.includes(word))) return false;
  }
  return true;
}

const comparators: Record<SortKey, (a: Listing, b: Listing) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
  most_viewed: (a, b) => b.views - a.views,
  price_per_area: (a, b) => pricePerSqft(a) - pricePerSqft(b),
};

/** Ties break by newest, then id, so the order (and paging) is stable and matches the database. */
const tiebreak = (a: Listing, b: Listing) => comparators.newest(a, b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export function sortListings(listings: Listing[], sort: SortKey = "newest"): Listing[] {
  return [...listings].sort((a, b) => comparators[sort](a, b) || tiebreak(a, b));
}

/** Price drop = latest price below the first recorded price. */
export function priceDrop(l: Pick<Listing, "priceHistory">): number | null {
  const first = l.priceHistory[0]?.price;
  const last = l.priceHistory.at(-1)?.price;
  return first && last && last < first ? first - last : null;
}

export const isNew = (l: Pick<Listing, "createdAt">, days = 7, now = Date.now()) =>
  now - new Date(l.createdAt).getTime() < days * 86_400_000;
