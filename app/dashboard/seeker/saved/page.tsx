import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { nbNameMap } from "@/lib/dashboard-data";
import { DashboardHeader } from "@/components/dashboard/stat-card";
import { CollectionsBoard } from "@/components/features/manage/collections-board";

export const metadata: Metadata = { title: "Saved homes" };

export default async function SavedPage() {
  const user = await requireRole(["seeker"]);
  let collections = await repo.collections.forUser(user.id);
  if (!collections.length) collections = [await repo.collections.create(user.id, "Shortlist")];
  const listings = await repo.listings.findManyByIds([...new Set(collections.flatMap((c) => c.listingIds))]);
  return (
    <>
      <DashboardHeader eyebrow="Seeker" title="Saved homes" description="Organise homes into collections and compare up to four side by side." />
      <CollectionsBoard collections={collections} listings={listings} nbNames={await nbNameMap()} />
    </>
  );
}
