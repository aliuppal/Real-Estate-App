import type { Repository } from "../../repository";
import type { Agency, Agent } from "../../types";
import { byNewest, newId, now, patchById, store, uniqueSlug } from "../store";

const isPublic = (status: string) => status === "active" || status === "under_offer";

export const neighbourhoods: Repository["neighbourhoods"] = {
  list: async () => store().neighbourhoods,
  findBySlug: async (slug) => store().neighbourhoods.find((n) => n.slug === slug) ?? null,
  findById: async (id) => store().neighbourhoods.find((n) => n.id === id) ?? null,
  listingCounts: async () =>
    store().listings.filter((l) => isPublic(l.status)).reduce<Record<string, number>>((acc, l) => {
      acc[l.neighbourhoodId] = (acc[l.neighbourhoodId] ?? 0) + 1;
      return acc;
    }, {}),
};

export const agents: Repository["agents"] = {
  list: async () => store().agents,
  findById: async (id) => store().agents.find((a) => a.id === id) ?? null,
  findBySlug: async (slug) => store().agents.find((a) => a.slug === slug) ?? null,
  byAgency: async (agencyId) => store().agents.filter((a) => a.agencyId === agencyId),
  createForUser: async (user) => {
    const agent: Agent = {
      id: newId("a"),
      slug: uniqueSlug(user.name, store().agents.map((a) => a.slug)),
      userId: user.id,
      agencyId: user.agencyId,
      name: user.name,
      photo: user.avatar ?? "",
      title: "Property Consultant",
      bio: "",
      phone: user.phone ?? "",
      email: user.email,
      specialties: ["house", "apartment"],
      purposes: ["sale", "rent"],
      serviceAreas: [],
      languages: ["Urdu", "English"],
      rating: 0,
      reviewCount: 0,
      dealsClosed: 0,
      dealsByPurpose: { sale: 0, rent: 0 },
      avgResponseMins: 60,
      yearsExperience: 0,
      priceBands: {},
      verification: "pending",
      createdAt: now(),
    };
    store().agents.push(agent);
    return agent;
  },
  update: async (id, patch) => patchById(store().agents, id, patch),
};

export const agencies: Repository["agencies"] = {
  create: async (input) => {
    const agency: Agency = {
      id: newId("ag"),
      slug: uniqueSlug(input.name, store().agencies.map((a) => a.slug)),
      name: input.name,
      logo: "",
      cover: "",
      description: "",
      foundedYear: new Date().getFullYear(),
      phone: input.phone,
      email: input.email,
      website: null,
      serviceAreas: [],
      verification: "pending",
      rating: 0,
      reviewCount: 0,
      createdAt: now(),
    };
    store().agencies.push(agency);
    return agency;
  },
  list: async () => store().agencies,
  findById: async (id) => store().agencies.find((a) => a.id === id) ?? null,
  findBySlug: async (slug) => store().agencies.find((a) => a.slug === slug) ?? null,
  update: async (id, patch) => patchById(store().agencies, id, patch),
};

export const verification: Repository["verification"] = {
  set: async (kind, id, status) => {
    patchById<Agent | Agency>(kind === "agent" ? store().agents : store().agencies, id, { verification: status });
  },
};

export const reviews: Repository["reviews"] = {
  forTarget: async (targetType, targetId) =>
    store().reviews.filter((r) => r.targetType === targetType && r.targetId === targetId).sort(byNewest),
};
