import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { viewingRows } from "@/lib/dashboard-data";
import { DashboardHeader } from "@/components/dashboard/stat-card";
import { ViewingList } from "@/components/features/manage/viewing-list";

export const metadata: Metadata = { title: "Viewings" };

export default async function OwnerViewingsPage() {
  const user = await requireRole(["owner"]);
  // Viewings on listings the owner shows personally; an agent handles the rest.
  const own = (await repo.listings.byOwner(user.id)).filter((l) => !l.agentId).map((l) => l.id);
  const viewings = (await repo.viewings.forListings(own)).filter((v) => !v.agentId);
  return (
    <>
      <DashboardHeader eyebrow="Owner / Seller" title="Viewings" description="Confirm or decline requests for homes you're showing yourself. Times are Lahore time." />
      <ViewingList rows={await viewingRows(viewings, "host")} perspective="host" />
    </>
  );
}
