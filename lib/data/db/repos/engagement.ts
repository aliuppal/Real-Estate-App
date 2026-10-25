import { asc, desc, eq, inArray } from "drizzle-orm";
import type { Repository } from "../../repository";
import type { Collection, Offer, Report, SavedSearch, Viewing } from "../../types";
import { matchesFilters } from "@/lib/search/filter";
import { db, schema } from "../client";
import { into, newId, out } from "../mappers";

const { savedSearches: ss, collections: col, viewings: v, offers: o, reports: rp } = schema;
const first = <T>(rows: T[]) => rows[0] ?? null;

export const savedSearches: Repository["savedSearches"] = {
  forUser: async (userId) => (await db().select().from(ss).where(eq(ss.userId, userId)).orderBy(desc(ss.createdAt))).map((r) => out<SavedSearch>(r)),
  create: async (input) => out<SavedSearch>((await db().insert(ss).values({ ...input, id: newId("ss") }).returning())[0]),
  update: async (id, patch) => first((await db().update(ss).set(into(patch)).where(eq(ss.id, id)).returning()).map((r) => out<SavedSearch>(r))),
  remove: async (id) => {
    await db().delete(ss).where(eq(ss.id, id));
  },
  // Filters live in jsonb, so matching reuses the reference implementation over alert-enabled searches.
  matchingAlerts: async (listing) =>
    (await db().select().from(ss).where(eq(ss.alertsEnabled, true))).map((r) => out<SavedSearch>(r)).filter((s) => matchesFilters(listing, s.filters)),
};

export const collections: Repository["collections"] = {
  forUser: async (userId) => (await db().select().from(col).where(eq(col.userId, userId)).orderBy(asc(col.createdAt))).map((r) => out<Collection>(r)),
  create: async (userId, name) => out<Collection>((await db().insert(col).values({ id: newId("col"), userId, name, listingIds: [] }).returning())[0]),
  rename: async (id, name) => {
    await db().update(col).set({ name }).where(eq(col.id, id));
  },
  remove: async (id) => {
    await db().delete(col).where(eq(col.id, id));
  },
  setMembership: async (id, listingId, member) => {
    const current = first(await db().select().from(col).where(eq(col.id, id)).limit(1));
    if (!current) return null;
    const has = current.listingIds.includes(listingId);
    const listingIds = member && !has ? [listingId, ...current.listingIds] : !member && has ? current.listingIds.filter((x) => x !== listingId) : current.listingIds;
    return out<Collection>((await db().update(col).set({ listingIds }).where(eq(col.id, id)).returning())[0]);
  },
};

export const viewings: Repository["viewings"] = {
  forSeeker: async (userId) => (await db().select().from(v).where(eq(v.seekerId, userId)).orderBy(asc(v.start))).map((r) => out<Viewing>(r)),
  forAgent: async (agentId) => (await db().select().from(v).where(eq(v.agentId, agentId)).orderBy(asc(v.start))).map((r) => out<Viewing>(r)),
  forListings: async (ids) => (ids.length ? (await db().select().from(v).where(inArray(v.listingId, ids)).orderBy(asc(v.start))).map((r) => out<Viewing>(r)) : []),
  findById: async (id) => first((await db().select().from(v).where(eq(v.id, id)).limit(1)).map((r) => out<Viewing>(r))),
  create: async (input) => out<Viewing>((await db().insert(v).values(into({ ...input, id: newId("v"), status: "requested" })).returning())[0]),
  setStatus: async (id, status) => first((await db().update(v).set({ status }).where(eq(v.id, id)).returning()).map((r) => out<Viewing>(r))),
};

export const offers: Repository["offers"] = {
  forSeeker: async (userId) => (await db().select().from(o).where(eq(o.seekerId, userId)).orderBy(desc(o.createdAt))).map((r) => out<Offer>(r)),
  forListings: async (ids) => (ids.length ? (await db().select().from(o).where(inArray(o.listingId, ids)).orderBy(desc(o.createdAt))).map((r) => out<Offer>(r)) : []),
  findById: async (id) => first((await db().select().from(o).where(eq(o.id, id)).limit(1)).map((r) => out<Offer>(r))),
  create: async (input) => out<Offer>((await db().insert(o).values({ ...input, id: newId("of"), status: "submitted" }).returning())[0]),
  setStatus: async (id, status) => first((await db().update(o).set({ status, updatedAt: new Date() }).where(eq(o.id, id)).returning()).map((r) => out<Offer>(r))),
};

export const reports: Repository["reports"] = {
  list: async () => (await db().select().from(rp).orderBy(desc(rp.createdAt))).map((r) => out<Report>(r)),
  create: async (input) => out<Report>((await db().insert(rp).values({ ...input, id: newId("rp"), status: "open" }).returning())[0]),
  setStatus: async (id, status) => {
    await db().update(rp).set({ status }).where(eq(rp.id, id));
  },
};
