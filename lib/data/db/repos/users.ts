import { eq, inArray, sql } from "drizzle-orm";
import type { Repository } from "../../repository";
import { toPublicUser, type PasswordResetToken, type User } from "../../types";
import { db, schema } from "../client";
import { into, newId, out } from "../mappers";

const t = schema.users;
const first = <T>(rows: T[]) => rows[0] ?? null;

export const users: Repository["users"] = {
  findById: async (id) => first((await db().select().from(t).where(eq(t.id, id)).limit(1)).map((r) => out<User>(r))),
  findByEmail: async (email) =>
    first((await db().select().from(t).where(sql`lower(${t.email}) = ${email.trim().toLowerCase()}`).limit(1)).map((r) => out<User>(r))),
  findManyByIds: async (ids) =>
    ids.length ? (await db().select().from(t).where(inArray(t.id, ids))).map((r) => toPublicUser(out<User>(r))) : [],
  create: async (input) => {
    const [row] = await db().insert(t).values({
      id: newId("u"), name: input.name, email: input.email.trim().toLowerCase(), passwordHash: input.passwordHash,
      role: input.role, avatar: input.avatar ?? null, agencyId: input.agencyId ?? null,
    }).returning();
    return out<User>(row);
  },
  update: async (id, patch) => {
    const [row] = await db().update(t).set(into(patch)).where(eq(t.id, id)).returning();
    return row ? out<User>(row) : null;
  },
  setPassword: async (id, passwordHash) => {
    await db().update(t).set({ passwordHash }).where(eq(t.id, id));
  },
  list: async () => (await db().select().from(t)).map((r) => toPublicUser(out<User>(r))),
};

const r = schema.passwordResetTokens;

export const passwordResets: Repository["passwordResets"] = {
  create: async (token) => {
    await db().delete(r).where(eq(r.userId, token.userId));
    await db().insert(r).values(into(token));
  },
  consume: async (token) => {
    const [row] = await db().delete(r).where(eq(r.token, token)).returning();
    if (!row) return null;
    const found = out<PasswordResetToken>(row);
    return new Date(found.expiresAt).getTime() > Date.now() ? found : null;
  },
};
