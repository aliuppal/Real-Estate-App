"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { LEAD_STAGES, repo, type Lead, type PublicUser } from "@/lib/data";
import { ActionError, actionUser, canManageListing, runAction } from "@/lib/auth/action";
import { notify } from "@/lib/notify";
import { formatInLahore } from "@/lib/availability";

const id = z.string().min(1);

/** A lead belongs to its agent; the agent's agency admin may also work it. */
async function manageableLead(user: PublicUser, leadId: string): Promise<Lead> {
  const lead = await repo.leads.findById(id.parse(leadId));
  if (!lead) throw new ActionError("Lead not found.");
  if (user.role === "agent" && lead.agentId === user.agentId) return lead;
  if (user.role === "agency_admin") {
    const agent = await repo.agents.findById(lead.agentId);
    if (agent?.agencyId && agent.agencyId === user.agencyId) return lead;
  }
  throw new ActionError("That lead isn't yours.");
}

async function hostUserId(agentId: string | null, ownerId: string | null) {
  if (agentId) return (await repo.agents.findById(agentId))?.userId ?? null;
  return ownerId;
}

export async function moveLead(leadId: string, stage: Lead["stage"]) {
  return runAction(async () => {
    const user = await actionUser(["agent", "agency_admin"]);
    const lead = await manageableLead(user, leadId);
    await repo.leads.update(lead.id, { stage: z.enum(LEAD_STAGES).parse(stage) });
    revalidatePath("/dashboard", "layout");
  });
}

export async function addLeadNote(leadId: string, body: string) {
  return runAction(async () => {
    const user = await actionUser(["agent", "agency_admin"]);
    const lead = await manageableLead(user, leadId);
    return repo.leads.addNote(lead.id, z.string().trim().min(1, "Write a note").max(1000).parse(body));
  });
}

export async function assignLead(leadId: string, agentId: string) {
  return runAction(async () => {
    const user = await actionUser(["agency_admin"]);
    const lead = await manageableLead(user, leadId);
    const agent = await repo.agents.findById(id.parse(agentId));
    if (!agent || agent.agencyId !== user.agencyId) throw new ActionError("Pick an agent from your team.");
    await repo.leads.update(lead.id, { agentId: agent.id });
    await notify([agent.userId], { type: "lead", title: "Lead assigned to you", body: lead.name, href: "/dashboard/agent/leads" });
    revalidatePath("/dashboard", "layout");
  });
}

/** Hosts (agent, or owner when there's no agent) confirm, complete or cancel; the seeker can cancel their own. */
export async function setViewingStatus(viewingId: string, status: "confirmed" | "completed" | "cancelled") {
  return runAction(async () => {
    const user = await actionUser();
    const next = z.enum(["confirmed", "completed", "cancelled"]).parse(status);
    const viewing = await repo.viewings.findById(id.parse(viewingId));
    if (!viewing) throw new ActionError("Viewing not found.");
    const listing = await repo.listings.findById(viewing.listingId);
    const isHost = !!listing && (viewing.agentId ? user.agentId === viewing.agentId : canManageListing(user, listing));
    const isSeeker = viewing.seekerId === user.id;
    if (!isHost && !(isSeeker && next === "cancelled")) throw new ActionError("You can't change this viewing.");

    await repo.viewings.setStatus(viewing.id, next);
    const when = formatInLahore(viewing.start, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
    const other = isSeeker ? (listing ? await hostUserId(listing.agentId, listing.ownerId) : null) : viewing.seekerId;
    await notify([other], { type: "viewing", title: `Viewing ${next}`, body: `${when} · ${listing?.title ?? ""}`, href: isSeeker ? "/dashboard" : "/dashboard/seeker/viewings" });
    revalidatePath("/dashboard", "layout");
  });
}

/** Listing managers mark offers as reviewing, accepted or rejected; seekers can withdraw their own. */
export async function decideOffer(offerId: string, status: "reviewing" | "accepted" | "rejected" | "withdrawn") {
  return runAction(async () => {
    const user = await actionUser();
    const next = z.enum(["reviewing", "accepted", "rejected", "withdrawn"]).parse(status);
    const offer = await repo.offers.findById(id.parse(offerId));
    if (!offer) throw new ActionError("Offer not found.");
    const listing = await repo.listings.findById(offer.listingId);
    if (!listing) throw new ActionError("That listing no longer exists.");
    const isSeeker = offer.seekerId === user.id;
    if (next === "withdrawn" ? !isSeeker : !canManageListing(user, listing)) throw new ActionError("You can't change this offer.");

    await repo.offers.setStatus(offer.id, next);
    if (next === "accepted") await repo.listings.update(listing.id, { status: "under_offer" });
    const label = offer.kind === "offer" ? "offer" : "application";
    const title = next === "reviewing" ? `Your ${label} is being reviewed` : `${isSeeker ? "An" : "Your"} ${label} was ${next}`;
    await notify([isSeeker ? await hostUserId(listing.agentId, listing.ownerId) : offer.seekerId], {
      type: "offer", title, body: listing.title, href: isSeeker ? "/dashboard" : "/dashboard/seeker/offers",
    });
    revalidatePath("/dashboard", "layout");
  });
}
