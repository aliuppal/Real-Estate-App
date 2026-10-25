import "server-only";
import { repo, type Lead, type Listing, type Notification, type PublicUser } from "@/lib/data";

type Payload = Pick<Notification, "type" | "title" | "body" | "href">;

export async function notify(userIds: (string | null | undefined)[], payload: Payload) {
  const unique = [...new Set(userIds.filter((id): id is string => !!id))];
  await Promise.all(unique.map((userId) => repo.notifications.create({ userId, ...payload })));
}

export async function notifyAdmins(payload: Payload) {
  const admins = (await repo.users.list()).filter((u) => u.role === "admin");
  await notify(admins.map((a) => a.id), payload);
}

/** Who answers questions about a listing: its agent if it has one, otherwise its owner. */
export async function listingContact(listing: Listing): Promise<{ userId: string; name: string; agentId: string | null } | null> {
  if (listing.agentId) {
    const agent = await repo.agents.findById(listing.agentId);
    if (agent) return { userId: agent.userId, name: agent.name, agentId: agent.id };
  }
  if (listing.ownerId) {
    const owner = await repo.users.findById(listing.ownerId);
    if (owner) return { userId: owner.id, name: owner.name, agentId: null };
  }
  return null;
}

/** Reuses the agent's open lead for this person and listing, or creates one. Moves it forward, never back. */
export async function upsertLead(
  agentId: string,
  person: PublicUser,
  listing: Listing,
  source: Lead["source"],
  atLeast: Lead["stage"] = "new",
): Promise<Lead> {
  const order: Lead["stage"][] = ["new", "contacted", "viewing", "offer", "closed"];
  const existing = (await repo.leads.forAgent(agentId)).find(
    (l) => l.seekerId === person.id && l.listingId === listing.id && l.stage !== "lost" && l.stage !== "closed",
  );
  const lead = existing ?? (await repo.leads.create({
    agentId, seekerId: person.id, listingId: listing.id, name: person.name, email: person.email,
    phone: person.phone, source, budget: listing.price,
  }));
  if (order.indexOf(atLeast) > order.indexOf(lead.stage)) await repo.leads.update(lead.id, { stage: atLeast });
  return lead;
}

/** Tells people whose alert-enabled saved searches match a newly published listing. */
export async function alertSavedSearches(listing: Listing) {
  const matches = await repo.savedSearches.matchingAlerts(listing);
  await Promise.all(matches.map((s) => repo.notifications.create({
    userId: s.userId,
    type: "saved_search_match",
    title: `New match for “${s.name}”`,
    body: listing.title,
    href: `/listings/${listing.id}`,
  })));
}
