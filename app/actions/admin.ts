"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { repo } from "@/lib/data";
import { ActionError, actionUser, runAction } from "@/lib/auth/action";
import { listingContact, notify } from "@/lib/notify";

const id = z.string().min(1);

export async function setVerification(kind: "agent" | "agency", targetId: string, status: "verified" | "rejected", reason?: string) {
  return runAction(async () => {
    await actionUser(["admin"]);
    const next = z.enum(["verified", "rejected"]).parse(status);
    const why = z.string().trim().max(500).optional().parse(reason) || undefined;
    if (next === "rejected" && !why) throw new ActionError("Give a reason so they know what to fix.");

    let recipients: string[];
    let label: string;
    if (z.enum(["agent", "agency"]).parse(kind) === "agent") {
      const agent = await repo.agents.findById(id.parse(targetId));
      if (!agent) throw new ActionError("Agent not found.");
      recipients = [agent.userId];
      label = "Your agent profile";
    } else {
      const agency = await repo.agencies.findById(id.parse(targetId));
      if (!agency) throw new ActionError("Agency not found.");
      recipients = (await repo.users.list()).filter((u) => u.role === "agency_admin" && u.agencyId === agency.id).map((u) => u.id);
      label = agency.name;
    }
    await repo.verification.set(kind, targetId, next, why);
    await notify(recipients, {
      type: "verification",
      title: next === "verified" ? `${label} is verified` : `${label} wasn't verified`,
      body: why ?? "You'll now show a verified badge.",
      href: null,
    });
    revalidatePath("/", "layout");
  });
}

export async function moderateListing(listingId: string, status: "active" | "archived", reason?: string) {
  return runAction(async () => {
    await actionUser(["admin"]);
    const listing = await repo.listings.findById(id.parse(listingId));
    if (!listing) throw new ActionError("Listing not found.");
    const next = z.enum(["active", "archived"]).parse(status);
    await repo.listings.update(listing.id, { status: next });
    if (next === "archived") {
      const contact = await listingContact(listing);
      await notify([contact?.userId], { type: "system", title: "Your listing was taken down", body: reason?.trim() || listing.title, href: null });
    }
    revalidatePath("/", "layout");
  });
}

export async function setListingVerified(listingId: string, verified: boolean) {
  return runAction(async () => {
    await actionUser(["admin"]);
    const listing = await repo.listings.findById(id.parse(listingId));
    if (!listing) throw new ActionError("Listing not found.");
    await repo.listings.update(listing.id, { verified: z.boolean().parse(verified) });
    revalidatePath("/", "layout");
  });
}

export async function resolveReport(reportId: string, status: "resolved" | "dismissed") {
  return runAction(async () => {
    await actionUser(["admin"]);
    await repo.reports.setStatus(id.parse(reportId), z.enum(["resolved", "dismissed"]).parse(status));
    revalidatePath("/dashboard/admin", "layout");
  });
}

export async function setUserStatus(userId: string, status: "active" | "suspended") {
  return runAction(async () => {
    const admin = await actionUser(["admin"]);
    const target = await repo.users.findById(id.parse(userId));
    if (!target) throw new ActionError("User not found.");
    if (target.id === admin.id || target.role === "admin") throw new ActionError("Admins can't be suspended here.");
    await repo.users.update(target.id, { status: z.enum(["active", "suspended"]).parse(status) });
    revalidatePath("/dashboard/admin/users");
  });
}
