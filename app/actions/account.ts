"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { PROPERTY_TYPES, PURPOSES, repo } from "@/lib/data";
import { ActionError, actionUser, runAction } from "@/lib/auth/action";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  phone: z.string().trim().regex(/^\+?[\d\s-]{7,20}$/, "Enter a valid phone number").nullable(),
});

export async function updateProfile(input: z.infer<typeof profileSchema>) {
  return runAction(async () => {
    const user = await actionUser();
    const data = profileSchema.parse(input);
    await repo.users.update(user.id, data);
    // Agents' public profiles show the same name and phone.
    if (user.agentId) await repo.agents.update(user.agentId, { name: data.name, phone: data.phone ?? "" });
    revalidatePath("/", "layout");
  });
}

const agentProfileSchema = z.object({
  title: z.string().trim().min(2).max(60),
  bio: z.string().trim().max(800),
  languages: z.array(z.string().trim().min(2).max(30)).min(1, "Add at least one language").max(6),
  specialties: z.array(z.enum(PROPERTY_TYPES)).min(1, "Pick at least one specialty"),
  purposes: z.array(z.enum(PURPOSES)).min(1, "Pick sales, rentals or both"),
  serviceAreas: z.array(z.string()).min(1, "Pick at least one area").max(5),
  yearsExperience: z.number().int().min(0).max(60),
});

export async function updateAgentProfile(input: z.infer<typeof agentProfileSchema>) {
  return runAction(async () => {
    const user = await actionUser(["agent"]);
    if (!user.agentId) throw new ActionError("Your agent profile is missing.");
    const data = agentProfileSchema.parse(input);
    const known = new Set((await repo.neighbourhoods.list()).map((n) => n.id));
    await repo.agents.update(user.agentId, { ...data, serviceAreas: data.serviceAreas.filter((a) => known.has(a)) });
    revalidatePath("/", "layout");
  });
}
