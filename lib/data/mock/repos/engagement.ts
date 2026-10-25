import type { Repository } from "../../repository";
import type { Collection, Offer, Report, SavedSearch, Viewing } from "../../types";
import { matchesFilters } from "@/lib/search/filter";
import { byNewest, newId, now, patchById, store } from "../store";

const byStart = (a: Viewing, b: Viewing) => a.start.localeCompare(b.start);

export const savedSearches: Repository["savedSearches"] = {
  forUser: async (userId) => store().savedSearches.filter((s) => s.userId === userId).sort(byNewest),
  create: async (input) => {
    const search: SavedSearch = { ...input, id: newId("ss"), lastCheckedAt: now(), createdAt: now() };
    store().savedSearches.push(search);
    return search;
  },
  update: async (id, patch) => patchById(store().savedSearches, id, patch),
  remove: async (id) => {
    const s = store();
    s.savedSearches = s.savedSearches.filter((x) => x.id !== id);
  },
  matchingAlerts: async (listing) =>
    store().savedSearches.filter((s) => s.alertsEnabled && matchesFilters(listing, s.filters)),
};

export const collections: Repository["collections"] = {
  forUser: async (userId) => store().collections.filter((c) => c.userId === userId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  create: async (userId, name) => {
    const collection: Collection = { id: newId("col"), userId, name, listingIds: [], createdAt: now() };
    store().collections.push(collection);
    return collection;
  },
  rename: async (id, name) => {
    patchById(store().collections, id, { name });
  },
  remove: async (id) => {
    const s = store();
    s.collections = s.collections.filter((c) => c.id !== id);
  },
  setMembership: async (id, listingId, member) => {
    const c = store().collections.find((x) => x.id === id);
    if (!c) return null;
    const has = c.listingIds.includes(listingId);
    if (member && !has) c.listingIds = [listingId, ...c.listingIds];
    if (!member && has) c.listingIds = c.listingIds.filter((x) => x !== listingId);
    return c;
  },
};

export const viewings: Repository["viewings"] = {
  forSeeker: async (userId) => store().viewings.filter((v) => v.seekerId === userId).sort(byStart),
  forAgent: async (agentId) => store().viewings.filter((v) => v.agentId === agentId).sort(byStart),
  forListings: async (ids) => store().viewings.filter((v) => ids.includes(v.listingId)).sort(byStart),
  findById: async (id) => store().viewings.find((v) => v.id === id) ?? null,
  create: async (input) => {
    const viewing: Viewing = { ...input, id: newId("v"), status: "requested", createdAt: now() };
    store().viewings.push(viewing);
    return viewing;
  },
  setStatus: async (id, status) => patchById(store().viewings, id, { status }),
};

export const offers: Repository["offers"] = {
  forSeeker: async (userId) => store().offers.filter((o) => o.seekerId === userId).sort(byNewest),
  forListings: async (ids) => store().offers.filter((o) => ids.includes(o.listingId)).sort(byNewest),
  findById: async (id) => store().offers.find((o) => o.id === id) ?? null,
  create: async (input) => {
    const offer: Offer = { ...input, id: newId("of"), status: "submitted", createdAt: now(), updatedAt: now() };
    store().offers.push(offer);
    return offer;
  },
  setStatus: async (id, status) => patchById(store().offers, id, { status, updatedAt: now() }),
};

export const reports: Repository["reports"] = {
  list: async () => [...store().reports].sort(byNewest),
  create: async (input) => {
    const report: Report = { ...input, id: newId("rp"), status: "open", createdAt: now() };
    store().reports.push(report);
    return report;
  },
  setStatus: async (id, status) => {
    patchById(store().reports, id, { status });
  },
};
