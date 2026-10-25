import { and, arrayContains, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Repository } from "../../repository";
import type { Conversation, Message, Notification } from "../../types";
import { db, schema } from "../client";
import { newId, out } from "../mappers";

const { conversations: c, messages: m, notifications: nt } = schema;
const first = <T>(rows: T[]) => rows[0] ?? null;

export const conversations: Repository["conversations"] = {
  findById: async (id) => first((await db().select().from(c).where(eq(c.id, id)).limit(1)).map((r) => out<Conversation>(r))),
  forUser: async (userId) =>
    (await db().select().from(c).where(arrayContains(c.participantIds, [userId])).orderBy(desc(c.lastMessageAt))).map((r) => out<Conversation>(r)),
  findOrStart: async (listingId, participantIds) => {
    const people = [...new Set(participantIds)];
    const candidates = await db().select().from(c)
      .where(and(listingId ? eq(c.listingId, listingId) : isNull(c.listingId), arrayContains(c.participantIds, people)));
    const existing = candidates.find((x) => x.participantIds.length === people.length);
    if (existing) return out<Conversation>(existing);
    return out<Conversation>((await db().insert(c).values({ id: newId("cv"), listingId, participantIds: people }).returning())[0]);
  },
  messages: async (conversationId) =>
    (await db().select().from(m).where(eq(m.conversationId, conversationId)).orderBy(asc(m.createdAt))).map((r) => out<Message>(r)),
  send: async (conversationId, senderId, body) => {
    const [row] = await db().insert(m).values({ id: newId("m"), conversationId, senderId, body, readBy: [senderId] }).returning();
    await db().update(c).set({ lastMessageAt: row.createdAt }).where(eq(c.id, conversationId));
    return out<Message>(row);
  },
  markRead: async (conversationId, userId) => {
    await db().update(m).set({ readBy: sql`array_append(${m.readBy}, ${userId})` })
      .where(and(eq(m.conversationId, conversationId), sql`not (${userId} = any(${m.readBy}))`));
  },
  unreadCount: async (userId) => {
    const mine = (await db().select({ id: c.id }).from(c).where(arrayContains(c.participantIds, [userId]))).map((r) => r.id);
    if (!mine.length) return 0;
    const [{ n }] = await db().select({ n: sql<number>`count(*)::int` }).from(m)
      .where(and(inArray(m.conversationId, mine), sql`not (${userId} = any(${m.readBy}))`));
    return n;
  },
};

export const notifications: Repository["notifications"] = {
  forUser: async (userId) => (await db().select().from(nt).where(eq(nt.userId, userId)).orderBy(desc(nt.createdAt))).map((r) => out<Notification>(r)),
  unreadCount: async (userId) => {
    const [{ n }] = await db().select({ n: sql<number>`count(*)::int` }).from(nt).where(and(eq(nt.userId, userId), eq(nt.read, false)));
    return n;
  },
  create: async (input) => out<Notification>((await db().insert(nt).values({ ...input, id: newId("nt"), read: false }).returning())[0]),
  markRead: async (userId, ids) => {
    if (ids !== "all" && !ids.length) return;
    await db().update(nt).set({ read: true }).where(ids === "all" ? eq(nt.userId, userId) : and(eq(nt.userId, userId), inArray(nt.id, ids)));
  },
};
