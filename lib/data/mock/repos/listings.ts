import type { Repository } from "../../repository";
import type { Listing } from "../../types";
import { matchesFilters, sortListings } from "@/lib/search/filter";
import { byNewest, newId, now, store, uniqueSlug } from "../store";

const isPublic = (l: Listing) => l.status === "active" || l.status === "under_offer";
const publicMatches = (filters: Parameters<typeof matchesFilters>[1]) =>
  sortListings(store().listings.filter((l) => isPublic(l) && matchesFilters(l, filters)), filters.sort);

export const listings: Repository["listings"] = {
  search: async (filters, page = 1, pageSize = 24) => {
    const matches = publicMatches(filters);
    const start = (page - 1) * pageSize;
    return { items: matches.slice(start, start + pageSize), total: matches.length, page, pageSize };
  },
  searchAll: async (filters) => publicMatches(filters),
  findById: async (id) => store().listings.find((l) => l.id === id) ?? null,
  findBySlug: async (slug) => store().listings.find((l) => l.slug === slug) ?? null,
  findManyByIds: async (ids) => {
    const all = store().listings;
    return ids.map((id) => all.find((l) => l.id === id)).filter((l): l is Listing => !!l);
  },
  featured: async (limit) =>
    store().listings.filter((l) => l.status === "active" && l.verified).sort((a, b) => b.saves - a.saves).slice(0, limit),
  newSince: async (days, limit) =>
    store().listings.filter((l) => l.status === "active" && matchesFilters(l, { listedWithinDays: days })).sort(byNewest).slice(0, limit),
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
  comparables: async ({ type, purpose }) =>
    store().listings.filter((l) => isPublic(l) && l.type === type && l.purpose === purpose),
  all: async () => store().listings,

  create: async (input) => {
    const id = newId("l");
    const created = now();
    const listing: Listing = {
      ...input,
      id,
      slug: uniqueSlug(input.title, store().listings.map((l) => l.slug)),
      verified: false,
      views: 0,
      saves: 0,
      enquiries: 0,
      priceHistory: [{ date: created, price: input.price }],
      createdAt: created,
      updatedAt: created,
    };
    store().listings.push(listing);
    return listing;
  },

  update: async (id, patch) => {
    const listing = store().listings.find((l) => l.id === id);
    if (!listing) return null;
    const changedAt = now();
    if (patch.price != null && patch.price !== listing.price) {
      listing.priceHistory = [...listing.priceHistory, { date: changedAt, price: patch.price }];
    }
    Object.assign(listing, patch, { updatedAt: changedAt });
    return listing;
  },

  recordView: async (id) => {
    const listing = store().listings.find((l) => l.id === id);
    if (listing) listing.views += 1;
  },

  adjustCounter: async (id, key, delta) => {
    const listing = store().listings.find((l) => l.id === id);
    if (listing) listing[key] = Math.max(0, listing[key] + delta);
  },
};

export const stats: Repository["stats"] = {
  platform: async () => {
    const s = store();
    return {
      users: s.users.length,
      activeListings: s.listings.filter((l) => l.status === "active").length,
      agents: s.agents.length,
      agencies: s.agencies.length,
      pendingVerifications:
        s.agents.filter((a) => a.verification === "pending").length + s.agencies.filter((a) => a.verification === "pending").length,
      openReports: s.reports.filter((r) => r.status === "open").length,
    };
  },
};
