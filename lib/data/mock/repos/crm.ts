import type { Repository } from "../../repository";
import type { Lead, LeadNote } from "../../types";
import { byNewest, newId, now, patchById, store } from "../store";

export const leads: Repository["leads"] = {
  forAgent: async (agentId) => store().leads.filter((l) => l.agentId === agentId).sort(byNewest),
  forAgency: async (agencyId) => {
    const team = new Set(store().agents.filter((a) => a.agencyId === agencyId).map((a) => a.id));
    return store().leads.filter((l) => team.has(l.agentId)).sort(byNewest);
  },
  findById: async (id) => store().leads.find((l) => l.id === id) ?? null,
  create: async (input) => {
    const created = now();
    const lead: Lead = { ...input, id: newId("ld"), stage: "new", notes: [], createdAt: created, updatedAt: created };
    store().leads.push(lead);
    return lead;
  },
  update: async (id, patch) => patchById(store().leads, id, { ...patch, updatedAt: now() }),
  addNote: async (id, body) => {
    const lead = store().leads.find((l) => l.id === id);
    if (!lead) return null;
    const note: LeadNote = { id: newId("ln"), body, createdAt: now() };
    lead.notes = [note, ...lead.notes];
    lead.updatedAt = note.createdAt;
    return note;
  },
};
