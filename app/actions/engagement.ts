"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { repo, type SearchFilters } from "@/lib/data";
import { ActionError, actionUser, runAction } from "@/lib/auth/action";
import { notifyAdmins } from "@/lib/notify";
import { filtersToSearchParams, searchParamsToFilters } from "@/lib/search/params";

const id = z.string().min(1);
const name = z.string().trim().min(1, "Give it a name").max(60);

async function ownCollection(userId: string, collectionId: string) {
  const c = (await repo.collections.forUser(userId)).find((x) => x.id === collectionId);
  if (!c) throw new ActionError("That collection doesn't exist.");
  return c;
}

/**
 * Heart button. Without a collection id it toggles: unsaved homes go into the first collection
 * (creating "Shortlist" if needed); saved homes are removed from every collection.
 */
export async function toggleSaved(listingId: string, collectionId?: string) {
  return runAction(async () => {
    const user = await actionUser(["seeker"]);
    id.parse(listingId);
    if (!(await repo.listings.findById(listingId))) throw new ActionError("That listing no longer exists.");
    let collections = await repo.collections.forUser(user.id);
    if (!collections.length) collections = [await repo.collections.create(user.id, "Shortlist")];

    const wasSaved = collections.some((c) => c.listingIds.includes(listingId));
    if (collectionId) {
      const target = await ownCollection(user.id, collectionId);
      await repo.collections.setMembership(target.id, listingId, !target.listingIds.includes(listingId));
    } else if (wasSaved) {
      await Promise.all(collections.map((c) => repo.collections.setMembership(c.id, listingId, false)));
    } else {
      await repo.collections.setMembership(collections[0].id, listingId, true);
    }

    const after = await repo.collections.forUser(user.id);
    const saved = after.some((c) => c.listingIds.includes(listingId));
    if (saved !== wasSaved) await repo.listings.adjustCounter(listingId, "saves", saved ? 1 : -1);
    revalidatePath("/dashboard/seeker", "layout");
    return { saved, collectionIds: after.filter((c) => c.listingIds.includes(listingId)).map((c) => c.id) };
  });
}

export async function createCollection(rawName: string) {
  return runAction(async () => {
    const user = await actionUser(["seeker"]);
    const c = await repo.collections.create(user.id, name.parse(rawName));
    revalidatePath("/dashboard/seeker/saved");
    return c;
  });
}

export async function renameCollection(collectionId: string, rawName: string) {
  return runAction(async () => {
    const user = await actionUser(["seeker"]);
    await ownCollection(user.id, collectionId);
    await repo.collections.rename(collectionId, name.parse(rawName));
    revalidatePath("/dashboard/seeker/saved");
  });
}

export async function deleteCollection(collectionId: string) {
  return runAction(async () => {
    const user = await actionUser(["seeker"]);
    await ownCollection(user.id, collectionId);
    await repo.collections.remove(collectionId);
    revalidatePath("/dashboard/seeker/saved");
  });
}

export async function saveSearch(input: { name: string; filters: SearchFilters; alertsEnabled: boolean }) {
  return runAction(async () => {
    const user = await actionUser(["seeker"]);
    // Round-trip through the URL codec to drop anything the filter schema doesn't know.
    const filters = searchParamsToFilters(filtersToSearchParams(input.filters));
    const search = await repo.savedSearches.create({ userId: user.id, name: name.parse(input.name), filters, alertsEnabled: z.boolean().parse(input.alertsEnabled) });
    revalidatePath("/dashboard/seeker/searches");
    return search;
  });
}

async function ownSearch(userId: string, searchId: string) {
  const s = (await repo.savedSearches.forUser(userId)).find((x) => x.id === searchId);
  if (!s) throw new ActionError("That saved search doesn't exist.");
  return s;
}

export async function updateSavedSearch(searchId: string, patch: { alertsEnabled?: boolean; name?: string }) {
  return runAction(async () => {
    const user = await actionUser(["seeker"]);
    await ownSearch(user.id, searchId);
    await repo.savedSearches.update(searchId, z.object({ alertsEnabled: z.boolean().optional(), name: name.optional() }).parse(patch));
    revalidatePath("/dashboard/seeker/searches");
  });
}

export async function deleteSavedSearch(searchId: string) {
  return runAction(async () => {
    const user = await actionUser(["seeker"]);
    await ownSearch(user.id, searchId);
    await repo.savedSearches.remove(searchId);
    revalidatePath("/dashboard/seeker/searches");
  });
}

export async function reportListing(listingId: string, reason: string) {
  return runAction(async () => {
    const user = await actionUser();
    const listing = await repo.listings.findById(id.parse(listingId));
    if (!listing) throw new ActionError("That listing no longer exists.");
    await repo.reports.create({ listingId, reporterId: user.id, reason: z.string().trim().min(5, "Tell us what's wrong").max(500).parse(reason) });
    await notifyAdmins({ type: "system", title: "Listing reported", body: listing.title, href: "/dashboard/admin/reports" });
  });
}
