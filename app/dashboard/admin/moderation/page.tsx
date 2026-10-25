import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { managedListings } from "@/lib/dashboard-data";
import { DashboardHeader } from "@/components/dashboard/stat-card";
import { ListingManager } from "@/components/features/manage/listing-manager";

export const metadata: Metadata = { title: "Listing moderation" };

export default async function ModerationPage() {
  await requireRole(["admin"]);
  const [listings, reports] = await Promise.all([repo.listings.all(), repo.reports.list()]);
  const reported = new Set(reports.filter((r) => r.status === "open").map((r) => r.listingId));
  // Reported listings first, then unverified, then newest.
  const ordered = [...listings].sort((a, b) =>
    Number(reported.has(b.id)) - Number(reported.has(a.id)) || Number(a.verified) - Number(b.verified) || b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <DashboardHeader eyebrow="Platform admin" title="Listing moderation" description="Reported and unverified listings are listed first." />
      <ListingManager listings={await managedListings(ordered, true)} perspective="admin" emptyText="No listings." />
    </>
  );
}
