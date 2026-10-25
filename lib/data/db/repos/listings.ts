import { and, arrayContains, asc, between, desc, eq, gt, gte, ilike, inArray, lte, sql, type SQL } from "drizzle-orm";
import type { Repository } from "../../repository";
import type { Listing, SearchFilters } from "../../types";
import { pointInPolygon } from "@/lib/search/filter";
import { db, schema } from "../client";
import { listingIn, listingOut, newId, uniqueSlug } from "../mappers";

const t = schema.listings;
const PUBLIC = ["active", "under_offer"];
const first = <T>(rows: T[]) => rows[0] ?? null;
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/** SearchFilters → SQL. Mirrors lib/search/filter.ts `matchesFilters`, which stays the reference behaviour. */
function conditions(f: SearchFilters): SQL[] {
  const c: SQL[] = [inArray(t.status, PUBLIC)];
  if (f.purpose) c.push(eq(t.purpose, f.purpose));
  if (f.types?.length) c.push(inArray(t.type, f.types));
  if (f.neighbourhoodIds?.length) c.push(inArray(t.neighbourhoodId, f.neighbourhoodIds));
  if (f.minPrice != null) c.push(gte(t.price, f.minPrice));
  if (f.maxPrice != null) c.push(lte(t.price, f.maxPrice));
  if (f.minBeds != null) c.push(gte(t.beds, f.minBeds));
  if (f.minBaths != null) c.push(gte(t.baths, f.minBaths));
  if (f.minAreaSqft != null) c.push(gte(t.areaSqft, f.minAreaSqft));
  if (f.maxAreaSqft != null) c.push(lte(t.areaSqft, f.maxAreaSqft));
  if (f.furnished) c.push(eq(t.furnished, true));
  if (f.petsAllowed) c.push(eq(t.petsAllowed, true));
  if (f.parking) c.push(gt(t.parking, 0));
  if (f.amenities?.length) c.push(arrayContains(t.amenities, f.amenities));
  if (f.listedBy) c.push(eq(t.listedBy, f.listedBy));
  if (f.verifiedOnly) c.push(eq(t.verified, true));
  if (f.listedWithinDays != null) c.push(gte(t.createdAt, new Date(Date.now() - f.listedWithinDays * 86_400_000)));
  for (const word of f.q?.toLowerCase().split(/\s+/).filter(Boolean) ?? []) {
    c.push(ilike(sql`${t.title} || ' ' || ${t.address} || ' ' || ${t.description}`, `%${escapeLike(word)}%`));
  }
  if (f.polygon && f.polygon.length >= 3) {
    // Bounding box in SQL; the exact point-in-polygon test runs on the (small) result in JS.
    const lats = f.polygon.map((p) => p[0]);
    const lngs = f.polygon.map((p) => p[1]);
    c.push(between(t.lat, Math.min(...lats), Math.max(...lats)), between(t.lng, Math.min(...lngs), Math.max(...lngs)));
  }
  return c;
}

function order(f: SearchFilters) {
  switch (f.sort) {
    case "price_asc": return [asc(t.price)];
    case "price_desc": return [desc(t.price)];
    case "most_viewed": return [desc(t.views)];
    case "price_per_area": return [asc(sql`${t.price}::float8 / nullif(${t.areaSqft}, 0)`)];
    default: return [desc(t.createdAt)];
  }
}

const inPolygon = (f: SearchFilters) => (l: Listing) =>
  !f.polygon || f.polygon.length < 3 || pointInPolygon(l.location.lat, l.location.lng, f.polygon);

async function matching(f: SearchFilters) {
  return (await db().select().from(t).where(and(...conditions(f))).orderBy(...order(f))).map(listingOut).filter(inPolygon(f));
}

export const listings: Repository["listings"] = {
  search: async (filters, page = 1, pageSize = 24) => {
    const offset = (page - 1) * pageSize;
    if (filters.polygon && filters.polygon.length >= 3) {
      const all = await matching(filters);
      return { items: all.slice(offset, offset + pageSize), total: all.length, page, pageSize };
    }
    const where = and(...conditions(filters));
    const [rows, [{ count }]] = await Promise.all([
      db().select().from(t).where(where).orderBy(...order(filters)).limit(pageSize).offset(offset),
      db().select({ count: sql<number>`count(*)::int` }).from(t).where(where),
    ]);
    return { items: rows.map(listingOut), total: count, page, pageSize };
  },
  searchAll: matching,
  findById: async (id) => first((await db().select().from(t).where(eq(t.id, id)).limit(1)).map(listingOut)),
  findBySlug: async (slug) => first((await db().select().from(t).where(eq(t.slug, slug)).limit(1)).map(listingOut)),
  findManyByIds: async (ids) => {
    if (!ids.length) return [];
    const rows = (await db().select().from(t).where(inArray(t.id, ids))).map(listingOut);
    return ids.map((id) => rows.find((r) => r.id === id)).filter((x): x is Listing => !!x);
  },
  featured: async (limit) =>
    (await db().select().from(t).where(and(eq(t.status, "active"), eq(t.verified, true))).orderBy(desc(t.saves)).limit(limit)).map(listingOut),
  newSince: async (days, limit) =>
    (await db().select().from(t).where(and(eq(t.status, "active"), gte(t.createdAt, new Date(Date.now() - days * 86_400_000))))
      .orderBy(desc(t.createdAt)).limit(limit)).map(listingOut),
  byAgent: async (agentId) => (await db().select().from(t).where(eq(t.agentId, agentId)).orderBy(desc(t.createdAt))).map(listingOut),
  byOwner: async (ownerId) => (await db().select().from(t).where(eq(t.ownerId, ownerId)).orderBy(desc(t.createdAt))).map(listingOut),
  byAgency: async (agencyId) => (await db().select().from(t).where(eq(t.agencyId, agencyId)).orderBy(desc(t.createdAt))).map(listingOut),
  similar: async (listing, limit) => {
    const rows = (await db().select().from(t).where(and(inArray(t.status, PUBLIC), eq(t.purpose, listing.purpose), eq(t.type, listing.type))))
      .map(listingOut).filter((l) => l.id !== listing.id);
    return rows.sort((a, b) =>
      Number(b.neighbourhoodId === listing.neighbourhoodId) - Number(a.neighbourhoodId === listing.neighbourhoodId) ||
      Math.abs(a.price - listing.price) - Math.abs(b.price - listing.price)).slice(0, limit);
  },
  comparables: async ({ type, purpose }) =>
    (await db().select().from(t).where(and(inArray(t.status, PUBLIC), eq(t.type, type), eq(t.purpose, purpose)))).map(listingOut),
  all: async () => (await db().select().from(t).orderBy(desc(t.createdAt))).map(listingOut),

  create: async (input) => {
    const slugs = (await db().select({ slug: t.slug }).from(t)).map((r) => r.slug);
    const now = new Date().toISOString();
    const listing: Listing = {
      ...input, id: newId("l"), slug: uniqueSlug(input.title, slugs), verified: false, views: 0, saves: 0, enquiries: 0,
      priceHistory: [{ date: now, price: input.price }], createdAt: now, updatedAt: now,
    };
    await db().insert(t).values(listingIn(listing) as typeof t.$inferInsert);
    return listing;
  },
  update: async (id, patch) => {
    const current = await listings.findById(id);
    if (!current) return null;
    const now = new Date().toISOString();
    const priceHistory = patch.price != null && patch.price !== current.price
      ? [...current.priceHistory, { date: now, price: patch.price }] : undefined;
    const [row] = await db().update(t).set(listingIn({ ...patch, ...(priceHistory && { priceHistory }), updatedAt: now })).where(eq(t.id, id)).returning();
    return row ? listingOut(row) : null;
  },
  recordView: async (id) => {
    await db().update(t).set({ views: sql`${t.views} + 1` }).where(eq(t.id, id));
  },
  adjustCounter: async (id, key, delta) => {
    const col = key === "saves" ? t.saves : t.enquiries;
    await db().update(t).set({ [key]: sql`greatest(0, ${col} + ${delta})` }).where(eq(t.id, id));
  },
};

export const stats: Repository["stats"] = {
  platform: async () => {
    const { users, agents, agencies, reports } = schema;
    const [[u], [act], [ag], [agc], [pa], [pg], [rep]] = await Promise.all([
      db().select({ n: sql<number>`count(*)::int` }).from(users),
      db().select({ n: sql<number>`count(*)::int` }).from(t).where(eq(t.status, "active")),
      db().select({ n: sql<number>`count(*)::int` }).from(agents),
      db().select({ n: sql<number>`count(*)::int` }).from(agencies),
      db().select({ n: sql<number>`count(*)::int` }).from(agents).where(eq(agents.verification, "pending")),
      db().select({ n: sql<number>`count(*)::int` }).from(agencies).where(eq(agencies.verification, "pending")),
      db().select({ n: sql<number>`count(*)::int` }).from(reports).where(eq(reports.status, "open")),
    ]);
    return { users: u.n, activeListings: act.n, agents: ag.n, agencies: agc.n, pendingVerifications: pa.n + pg.n, openReports: rep.n };
  },
};
