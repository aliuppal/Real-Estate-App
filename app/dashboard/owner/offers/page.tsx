import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { offerRows } from "@/lib/dashboard-data";
import { DashboardHeader } from "@/components/dashboard/stat-card";
import { OfferList } from "@/components/features/manage/offer-list";

export const metadata: Metadata = { title: "Offers" };

export default async function OwnerOffersPage() {
  const user = await requireRole(["owner"]);
  const ids = (await repo.listings.byOwner(user.id)).map((l) => l.id);
  return (
    <>
      <DashboardHeader eyebrow="Owner / Seller" title="Offers & applications" description="Accepting an offer marks the listing as under offer." />
      <OfferList rows={await offerRows(await repo.offers.forListings(ids), "host")} perspective="host" emptyText="No offers on your listings yet." />
    </>
  );
}
