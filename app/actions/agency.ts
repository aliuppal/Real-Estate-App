"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { repo } from "@/lib/data";
import { ActionError, actionUser, runAction } from "@/lib/auth/action";
import { notify } from "@/lib/notify";

/**
 * Adds an existing, unaffiliated agent to the admin's agency. Email delivery isn't connected yet,
 * so inviting someone without an account is recorded as pending and nothing is sent.
 */
export async function inviteAgent(email: string) {
  return runAction(async () => {
    const admin = await actionUser(["agency_admin"]);
    if (!admin.agencyId) throw new ActionError("Your account isn't linked to an agency.");
    const user = await repo.users.findByEmail(z.email("Enter a valid email").parse(email.trim()));
    if (!user) return { status: "pending" as const };
    if (user.role !== "agent" || !user.agentId) throw new ActionError("That account isn't an agent account.");
    const agent = await repo.agents.findById(user.agentId);
    if (!agent) throw new ActionError("That agent profile is missing.");
    if (agent.agencyId === admin.agencyId) throw new ActionError("They're already on your team.");
    if (agent.agencyId) throw new ActionError("That agent already belongs to another agency.");

    await repo.agents.update(agent.id, { agencyId: admin.agencyId });
    await repo.users.update(user.id, { agencyId: admin.agencyId });
    const agency = await repo.agencies.findById(admin.agencyId);
    await notify([user.id], { type: "system", title: `You've joined ${agency?.name ?? "an agency"}`, body: "Your listings and leads now show on the agency dashboard.", href: "/dashboard/agent" });
    revalidatePath("/dashboard/agency", "layout");
    return { status: "added" as const, name: agent.name };
  });
}

export async function removeAgent(agentId: string) {
  return runAction(async () => {
    const admin = await actionUser(["agency_admin"]);
    const agent = await repo.agents.findById(z.string().min(1).parse(agentId));
    if (!agent || agent.agencyId !== admin.agencyId) throw new ActionError("That agent isn't on your team.");
    await repo.agents.update(agent.id, { agencyId: null });
    await repo.users.update(agent.userId, { agencyId: null });
    // Their listings stay with them, no longer under the agency.
    for (const listing of await repo.listings.byAgent(agent.id)) await repo.listings.update(listing.id, { agencyId: null });
    await notify([agent.userId], { type: "system", title: "You've left your agency", body: "You can keep working as an independent agent.", href: null });
    revalidatePath("/dashboard/agency", "layout");
  });
}

const profileSchema = z.object({
  description: z.string().trim().max(1000),
  phone: z.string().trim().regex(/^\+?[\d\s-]{7,20}$/, "Enter a valid phone number"),
  website: z.url("Enter a full URL, including https://").nullable(),
  serviceAreas: z.array(z.string()).max(10),
});

export async function updateAgencyProfile(input: z.infer<typeof profileSchema>) {
  return runAction(async () => {
    const admin = await actionUser(["agency_admin"]);
    if (!admin.agencyId) throw new ActionError("Your account isn't linked to an agency.");
    const data = profileSchema.parse(input);
    const known = new Set((await repo.neighbourhoods.list()).map((n) => n.id));
    await repo.agencies.update(admin.agencyId, { ...data, serviceAreas: data.serviceAreas.filter((a) => known.has(a)) });
    revalidatePath("/", "layout");
  });
}
