import { desc, eq, inArray } from "drizzle-orm";
import type { Repository } from "../../repository";
import type { Lead, LeadNote } from "../../types";
import { db, schema } from "../client";
import { into, newId, out } from "../mappers";

const { leads: t, agents: a } = schema;
const first = <T>(rows: T[]) => rows[0] ?? null;

export const leads: Repository["leads"] = {
  forAgent: async (agentId) => (await db().select().from(t).where(eq(t.agentId, agentId)).orderBy(desc(t.createdAt))).map((r) => out<Lead>(r)),
  forAgency: async (agencyId) => {
    const team = (await db().select({ id: a.id }).from(a).where(eq(a.agencyId, agencyId))).map((r) => r.id);
    return team.length ? (await db().select().from(t).where(inArray(t.agentId, team)).orderBy(desc(t.createdAt))).map((r) => out<Lead>(r)) : [];
  },
  findById: async (id) => first((await db().select().from(t).where(eq(t.id, id)).limit(1)).map((r) => out<Lead>(r))),
  create: async (input) => out<Lead>((await db().insert(t).values({ ...input, id: newId("ld"), stage: "new", notes: [] }).returning())[0]),
  update: async (id, patch) =>
    first((await db().update(t).set(into({ ...patch, updatedAt: new Date().toISOString() })).where(eq(t.id, id)).returning()).map((r) => out<Lead>(r))),
  addNote: async (id, body) => {
    const current = first(await db().select().from(t).where(eq(t.id, id)).limit(1));
    if (!current) return null;
    const note: LeadNote = { id: newId("ln"), body, createdAt: new Date().toISOString() };
    await db().update(t).set({ notes: [note, ...current.notes], updatedAt: new Date() }).where(eq(t.id, id));
    return note;
  },
};
