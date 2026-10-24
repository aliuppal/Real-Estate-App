import "server-only";
import type { Repository } from "../repository";
import { toPublicUser, type Listing } from "../types";
import { matchesFilters, sortListings } from "@/lib/search/filter";
import { newId, store } from "./store";

const isPublic = (l: Listing) => l.status === "active" || l.status === "under_offer";
const byNewest = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);

export const mockRepository: Repository = {
  kind: "mock",

  users: {
    findById: async (id) => store().users.find((u) => u.id === id) ?? null,
    findByEmail: async (email) =>
      store().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) ?? null,
    create: async (input) => {
      const user = {
        id: newId("u"),
        name: input.name,
        email: input.email.trim().toLowerCase(),
        passwordHash: input.passwordHash,
        role: input.role,
        avatar: input.avatar ?? null,
        phone: null,
        agentId: null,
        agencyId: input.agencyId ?? null,
        status: "active" as const,
        createdAt: new Date().toISOString(),
      };
      store().users.push(user);
      return user;
    },
    setPassword: async (id, passwordHash) => {
      const user = store().users.find((u) => u.id === id);
      if (user) user.passwordHash = passwordHash;
    },
    list: async () => store().users.map(toPublicUser),
  },

  passwordResets: {
    create: async (token) => {
      const s = store();
      s.resetTokens = s.resetTokens.filter((t) => t.userId !== token.userId).concat(token);
    },
    consume: async (token) => {
      const s = store();
      const found = s.resetTokens.find((t) => t.token === token) ?? null;
      s.resetTokens = s.resetTokens.filter((t) => t.token !== token);
      return found && new Date(found.expiresAt).getTime() > Date.now() ? found : null;
    },
  },

  neighbourhoods: {
    list: async () => store().neighbourhoods,
    findBySlug: async (slug) => store().neighbourhoods.find((n) => n.slug === slug) ?? null,
    listingCounts: async () =>
      store().listings.filter(isPublic).reduce<Record<string, number>>((acc, l) => {
        acc[l.neighbourhoodId] = (acc[l.neighbourhoodId] ?? 0) + 1;
        return acc;
      }, {}),
  },

  listings: {
    search: async (filters, page = 1, pageSize = 24) => {
      const matches = sortListings(store().listings.filter((l) => isPublic(l) && matchesFilters(l, filters)), filters.sort);
      const start = (page - 1) * pageSize;
      return { items: matches.slice(start, start + pageSize), total: matches.length, page, pageSize };
    },
    findById: async (id) => store().listings.find((l) => l.id === id) ?? null,
    findBySlug: async (slug) => store().listings.find((l) => l.slug === slug) ?? null,
    findManyByIds: async (ids) => {
      const all = store().listings;
      return ids.map((id) => all.find((l) => l.id === id)).filter((l): l is Listing => !!l);
    },
    featured: async (limit) =>
      store().listings.filter((l) => l.status === "active" && l.verified)
        .sort((a, b) => b.saves - a.saves).slice(0, limit),
    newSince: async (days, limit) =>
      store().listings.filter((l) => l.status === "active" && matchesFilters(l, { listedWithinDays: days }))
        .sort(byNewest).slice(0, limit),
    byAgent: async (agentId) => store().listings.filter((l) => l.agentId === agentId).sort(byNewest),
    byOwner: async (ownerId) => store().listings.filter((l) => l.ownerId === ownerId).sort(byNewest),
    byAgency: async (agencyId) => store().listings.filter((l) => l.agencyId === agencyId).sort(byNewest),
    similar: async (listing, limit) =>
      store().listings
        .filter((l) => l.id !== listing.id && isPublic(l) && l.purpose === listing.purpose && l.type === listing.type)
        .sort((a, b) =>
          Number(b.neighbourhoodId === listing.neighbourhoodId) - Number(a.neighbourhoodId === listing.neighbourhoodId) ||
          Math.abs(a.price - listing.price) - Math.abs(b.price - listing.price))
        .slice(0, limit),
  },

  agents: {
    list: async () => store().agents,
    findById: async (id) => store().agents.find((a) => a.id === id) ?? null,
    findBySlug: async (slug) => store().agents.find((a) => a.slug === slug) ?? null,
    byAgency: async (agencyId) => store().agents.filter((a) => a.agencyId === agencyId),
  },

  agencies: {
    create: async (input) => {
      const base = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const taken = new Set(store().agencies.map((a) => a.slug));
      let slug = base;
      for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
      const agency = {
        id: newId("ag"),
        slug,
        name: input.name,
        logo: "",
        cover: "",
        description: "",
        foundedYear: new Date().getFullYear(),
        phone: input.phone,
        email: input.email,
        website: null,
        serviceAreas: [],
        verification: "pending" as const,
        rating: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
      };
      store().agencies.push(agency);
      return agency;
    },
    list: async () => store().agencies,
    findById: async (id) => store().agencies.find((a) => a.id === id) ?? null,
    findBySlug: async (slug) => store().agencies.find((a) => a.slug === slug) ?? null,
  },

  reviews: {
    forTarget: async (targetType, targetId) =>
      store().reviews.filter((r) => r.targetType === targetType && r.targetId === targetId).sort(byNewest),
  },

  savedSearches: { forUser: async (userId) => store().savedSearches.filter((s) => s.userId === userId) },
  collections: { forUser: async (userId) => store().collections.filter((c) => c.userId === userId) },

  conversations: {
    forUser: async (userId) =>
      store().conversations.filter((c) => c.participantIds.includes(userId))
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)),
    messages: async (conversationId) =>
      store().messages.filter((m) => m.conversationId === conversationId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    unreadCount: async (userId) => {
      const mine = new Set(store().conversations.filter((c) => c.participantIds.includes(userId)).map((c) => c.id));
      return store().messages.filter((m) => mine.has(m.conversationId) && !m.readBy.includes(userId)).length;
    },
  },

  viewings: {
    forSeeker: async (userId) => store().viewings.filter((v) => v.seekerId === userId).sort((a, b) => a.start.localeCompare(b.start)),
    forAgent: async (agentId) => store().viewings.filter((v) => v.agentId === agentId).sort((a, b) => a.start.localeCompare(b.start)),
  },

  leads: {
    forAgent: async (agentId) => store().leads.filter((l) => l.agentId === agentId).sort(byNewest),
    forAgency: async (agencyId) => {
      const team = new Set(store().agents.filter((a) => a.agencyId === agencyId).map((a) => a.id));
      return store().leads.filter((l) => team.has(l.agentId)).sort(byNewest);
    },
  },

  offers: {
    forSeeker: async (userId) => store().offers.filter((o) => o.seekerId === userId).sort(byNewest),
    forListing: async (listingId) => store().offers.filter((o) => o.listingId === listingId).sort(byNewest),
  },

  notifications: {
    forUser: async (userId) => store().notifications.filter((n) => n.userId === userId).sort(byNewest),
    unreadCount: async (userId) => store().notifications.filter((n) => n.userId === userId && !n.read).length,
  },

  reports: { list: async () => [...store().reports].sort(byNewest) },

  stats: {
    platform: async () => {
      const s = store();
      return {
        users: s.users.length,
        activeListings: s.listings.filter((l) => l.status === "active").length,
        agents: s.agents.length,
        agencies: s.agencies.length,
        pendingVerifications:
          s.agents.filter((a) => a.verification === "pending").length +
          s.agencies.filter((a) => a.verification === "pending").length,
        openReports: s.reports.filter((r) => r.status === "open").length,
      };
    },
  },
};
