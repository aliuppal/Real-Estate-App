import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { nbNameMap } from "@/lib/dashboard-data";
import { DashboardHeader } from "@/components/dashboard/stat-card";
import { SavedSearchList } from "@/components/features/manage/saved-search-list";

export const metadata: Metadata = { title: "Saved searches" };

export default async function SearchesPage() {
  const user = await requireRole(["seeker"]);
  const searches = await repo.savedSearches.forUser(user.id);
  const counts = Object.fromEntries(await Promise.all(searches.map(async (s) => [s.id, (await repo.listings.search(s.filters, 1, 1)).total] as const)));
  return (
    <>
      <DashboardHeader eyebrow="Seeker" title="Saved searches" description="With alerts on, you're notified as soon as a matching home is listed." />
      <SavedSearchList searches={searches} nbNames={await nbNameMap()} matchCounts={counts} />
    </>
  );
}
