import type { Listing, Neighbourhood } from "../types";
import type { listings, neighbourhoods } from "./schema";

/** Columns stored as timestamptz; every other field maps 1:1 between rows and domain objects. */
const DATE_KEYS = new Set(["createdAt", "updatedAt", "lastCheckedAt", "lastMessageAt", "start", "end", "expiresAt"]);

/** Row → domain: Date values become ISO strings. */
export function out<T>(row: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) result[k] = v instanceof Date ? v.toISOString() : v;
  return result as T;
}

/** Domain → row: ISO strings in date columns become Date. Undefined keys are dropped (partial updates). */
export function into<T>(obj: object): T {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    result[k] = DATE_KEYS.has(k) && typeof v === "string" ? new Date(v) : v;
  }
  return result as T;
}

type ListingRow = typeof listings.$inferSelect;
type NeighbourhoodRow = typeof neighbourhoods.$inferSelect;

export function listingOut(row: ListingRow): Listing {
  const { lat, lng, ...rest } = row;
  return out<Listing>({ ...rest, location: { lat, lng } });
}

export function listingIn(l: Partial<Listing>): Partial<typeof listings.$inferInsert> {
  const { location, ...rest } = l;
  return into({ ...rest, ...(location && { lat: location.lat, lng: location.lng }) });
}

export function neighbourhoodOut(row: NeighbourhoodRow): Neighbourhood {
  const { lat, lng, ...rest } = row;
  return { ...rest, center: { lat, lng } };
}

let counter = 0;
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** First slug not in `taken`: "name", "name-2", "name-3"… */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const root = slugify(base) || "item";
  let slug = root;
  for (let n = 2; used.has(slug); n++) slug = `${root}-${n}`;
  return slug;
}
