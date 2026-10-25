"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { repo, type ListingStatus, type PropertyType, type Purpose } from "@/lib/data";
import type { NewListing } from "@/lib/data/repository";
import { ActionError, actionUser, assertCanManage, runAction } from "@/lib/auth/action";
import { LISTER_ROLES } from "@/lib/auth/roles";
import { alertSavedSearches, notify } from "@/lib/notify";
import { listingInputSchema, type ListingInput } from "@/lib/validation/listing";
import { suggestPrice } from "@/lib/pricing";
import { templateDescriptionGenerator, type DescriptionInput } from "@/lib/listing-copy";

export async function createListing(input: ListingInput, publish: boolean) {
  return runAction(async () => {
    const user = await actionUser(LISTER_ROLES);
    const data = listingInputSchema.parse(input);
    if (!(await repo.neighbourhoods.findById(data.neighbourhoodId))) throw new ActionError("Choose a neighbourhood.");

    // Who the listing belongs to comes from the caller's role, never from the form.
    let owner: Pick<NewListing, "listedBy" | "ownerId" | "agentId" | "agencyId">;
    if (user.role === "owner") {
      owner = { listedBy: "owner", ownerId: user.id, agentId: null, agencyId: null };
    } else if (user.role === "agent") {
      if (!user.agentId) throw new ActionError("Your agent profile isn't set up yet.");
      owner = { listedBy: "agent", ownerId: null, agentId: user.agentId, agencyId: user.agencyId };
    } else {
      const agent = data.agentId ? await repo.agents.findById(data.agentId) : null;
      if (!agent || agent.agencyId !== user.agencyId) throw new ActionError("Choose which of your agents will handle this listing.");
      owner = { listedBy: "agent", ownerId: null, agentId: agent.id, agencyId: user.agencyId };
    }

    const { agentId, ...fields } = data;
    void agentId;
    const listing = await repo.listings.create({
      ...fields,
      ...owner,
      status: publish ? "active" : "draft",
      floorPlan: null,
      depositMonths: data.purpose === "rent" ? data.depositMonths : null,
      advanceMonths: data.purpose === "rent" ? data.advanceMonths : null,
    });
    if (publish) await alertSavedSearches(listing);
    revalidatePath("/", "layout");
    return { id: listing.id };
  });
}

const STATUSES = ["draft", "active", "under_offer", "sold", "rented", "archived"] as const satisfies readonly ListingStatus[];

export async function updateListing(listingId: string, patch: { status?: ListingStatus; price?: number }) {
  return runAction(async () => {
    const user = await actionUser([...LISTER_ROLES, "admin"]);
    const listing = await repo.listings.findById(z.string().min(1).parse(listingId));
    assertCanManage(user, listing);
    const clean = z.object({ status: z.enum(STATUSES).optional(), price: z.number().int().positive().optional() }).parse(patch);
    const wasLive = listing.status === "active";
    const updated = await repo.listings.update(listing.id, clean);
    if (updated && !wasLive && updated.status === "active") await alertSavedSearches(updated);
    revalidatePath("/", "layout");
  });
}

export async function generateDescription(input: DescriptionInput) {
  return runAction(async () => {
    await actionUser(LISTER_ROLES);
    return templateDescriptionGenerator.generate(input);
  });
}

export async function suggestListingPrice(input: { type: PropertyType; purpose: Purpose; areaSqft: number; neighbourhoodId: string }) {
  return runAction(async () => {
    await actionUser(LISTER_ROLES);
    const neighbourhood = await repo.neighbourhoods.findById(input.neighbourhoodId);
    if (!neighbourhood || !(input.areaSqft > 0)) throw new ActionError("Add the neighbourhood and area first.");
    return suggestPrice(input, await repo.listings.comparables(input), neighbourhood);
  });
}

/** An owner hands their listing to up to three matched agents, each of whom gets a lead to pitch for it. */
export async function handOverToAgents(listingId: string, agentIds: string[]) {
  return runAction(async () => {
    const user = await actionUser(["owner"]);
    const listing = await repo.listings.findById(z.string().min(1).parse(listingId));
    assertCanManage(user, listing);
    if (listing.agentId) throw new ActionError("An agent is already handling this listing.");
    const ids = z.array(z.string()).min(1, "Pick at least one agent").max(3, "Pick up to three agents").parse(agentIds);
    let invited = 0;
    for (const agentId of ids) {
      const agent = await repo.agents.findById(agentId);
      if (!agent || agent.verification !== "verified") continue;
      await repo.leads.create({ agentId, seekerId: user.id, listingId: listing.id, name: user.name, email: user.email, phone: user.phone, source: "handover", budget: listing.price });
      await notify([agent.userId], { type: "lead", title: "An owner wants you to sell their property", body: listing.title, href: "/dashboard/agent/leads" });
      invited++;
    }
    return { invited };
  });
}
