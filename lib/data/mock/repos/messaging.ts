import type { Repository } from "../../repository";
import type { Conversation, Message, Notification } from "../../types";
import { byNewest, newId, now, store } from "../store";

const sameMembers = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));
const mineIds = (userId: string) =>
  new Set(store().conversations.filter((c) => c.participantIds.includes(userId)).map((c) => c.id));

export const conversations: Repository["conversations"] = {
  findById: async (id) => store().conversations.find((c) => c.id === id) ?? null,
  forUser: async (userId) =>
    store().conversations.filter((c) => c.participantIds.includes(userId)).sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)),
  findOrStart: async (listingId, participantIds) => {
    const people = [...new Set(participantIds)];
    const existing = store().conversations.find((c) => c.listingId === listingId && sameMembers(c.participantIds, people));
    if (existing) return existing;
    const created = now();
    const conversation: Conversation = { id: newId("cv"), listingId, participantIds: people, lastMessageAt: created, createdAt: created };
    store().conversations.push(conversation);
    return conversation;
  },
  messages: async (conversationId) =>
    store().messages.filter((m) => m.conversationId === conversationId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  send: async (conversationId, senderId, body) => {
    const message: Message = { id: newId("m"), conversationId, senderId, body, readBy: [senderId], createdAt: now() };
    store().messages.push(message);
    const conversation = store().conversations.find((c) => c.id === conversationId);
    if (conversation) conversation.lastMessageAt = message.createdAt;
    return message;
  },
  markRead: async (conversationId, userId) => {
    for (const m of store().messages) {
      if (m.conversationId === conversationId && !m.readBy.includes(userId)) m.readBy = [...m.readBy, userId];
    }
  },
  unreadCount: async (userId) => {
    const mine = mineIds(userId);
    return store().messages.filter((m) => mine.has(m.conversationId) && !m.readBy.includes(userId)).length;
  },
};

export const notifications: Repository["notifications"] = {
  forUser: async (userId) => store().notifications.filter((n) => n.userId === userId).sort(byNewest),
  unreadCount: async (userId) => store().notifications.filter((n) => n.userId === userId && !n.read).length,
  create: async (input) => {
    const notification: Notification = { ...input, id: newId("nt"), read: false, createdAt: now() };
    store().notifications.push(notification);
    return notification;
  },
  markRead: async (userId, ids) => {
    for (const n of store().notifications) {
      if (n.userId === userId && (ids === "all" || ids.includes(n.id))) n.read = true;
    }
  },
};
