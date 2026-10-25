import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Repository } from "../../repository";
import type { Agency, Agent, Review } from "../../types";
import { db, schema } from "../client";
import { into, neighbourhoodOut, newId, out, uniqueSlug } from "../mappers";

const { neighbourhoods: n, agents: a, agencies: g, reviews: rv, listings: l } = schema;
const first = <T>(rows: T[]) => rows[0] ?? null;

export const neighbourhoods: Repository["neighbourhoods"] = {
  list: async () => (await db().select().from(n)).map(neighbourhoodOut),
  findBySlug: async (slug) => first((await db().select().from(n).where(eq(n.slug, slug)).limit(1)).map(neighbourhoodOut)),
  findById: async (id) => first((await db().select().from(n).where(eq(n.id, id)).limit(1)).map(neighbourhoodOut)),
  listingCounts: async () => {
    const rows = await db().select({ id: l.neighbourhoodId, count: sql<number>`count(*)::int` }).from(l)
      .where(inArray(l.status, ["active", "under_offer"])).groupBy(l.neighbourhoodId);
    return Object.fromEntries(rows.map((r) => [r.id, r.count]));
  },
};

export const agents: Repository["agents"] = {
  list: async () => (await db().select().from(a)).map((r) => out<Agent>(r)),
  findById: async (id) => first((await db().select().from(a).where(eq(a.id, id)).limit(1)).map((r) => out<Agent>(r))),
  findBySlug: async (slug) => first((await db().select().from(a).where(eq(a.slug, slug)).limit(1)).map((r) => out<Agent>(r))),
  byAgency: async (agencyId) => (await db().select().from(a).where(eq(a.agencyId, agencyId))).map((r) => out<Agent>(r)),
  createForUser: async (user) => {
    const slugs = (await db().select({ slug: a.slug }).from(a)).map((r) => r.slug);
    const [row] = await db().insert(a).values({
      id: newId("a"), slug: uniqueSlug(user.name, slugs), userId: user.id, agencyId: user.agencyId, name: user.name,
      photo: user.avatar ?? "", title: "Property Consultant", bio: "", phone: user.phone ?? "", email: user.email,
      specialties: ["house", "apartment"], purposes: ["sale", "rent"], serviceAreas: [], languages: ["Urdu", "English"],
      dealsByPurpose: { sale: 0, rent: 0 }, avgResponseMins: 60, yearsExperience: 0, priceBands: {}, verification: "pending",
    }).returning();
    return out<Agent>(row);
  },
  update: async (id, patch) => {
    const [row] = await db().update(a).set(into(patch)).where(eq(a.id, id)).returning();
    return row ? out<Agent>(row) : null;
  },
};

export const agencies: Repository["agencies"] = {
  create: async (input) => {
    const slugs = (await db().select({ slug: g.slug }).from(g)).map((r) => r.slug);
    const [row] = await db().insert(g).values({
      id: newId("ag"), slug: uniqueSlug(input.name, slugs), name: input.name, phone: input.phone, email: input.email,
      foundedYear: new Date().getFullYear(), verification: "pending",
    }).returning();
    return out<Agency>(row);
  },
  list: async () => (await db().select().from(g)).map((r) => out<Agency>(r)),
  findById: async (id) => first((await db().select().from(g).where(eq(g.id, id)).limit(1)).map((r) => out<Agency>(r))),
  findBySlug: async (slug) => first((await db().select().from(g).where(eq(g.slug, slug)).limit(1)).map((r) => out<Agency>(r))),
  update: async (id, patch) => {
    const [row] = await db().update(g).set(into(patch)).where(eq(g.id, id)).returning();
    return row ? out<Agency>(row) : null;
  },
};

export const verification: Repository["verification"] = {
  set: async (kind, id, status) => {
    if (kind === "agent") await db().update(a).set({ verification: status }).where(eq(a.id, id));
    else await db().update(g).set({ verification: status }).where(eq(g.id, id));
  },
};

export const reviews: Repository["reviews"] = {
  forTarget: async (targetType, targetId) =>
    (await db().select().from(rv).where(and(eq(rv.targetType, targetType), eq(rv.targetId, targetId))).orderBy(desc(rv.createdAt)))
      .map((r) => out<Review>(r)),
};
