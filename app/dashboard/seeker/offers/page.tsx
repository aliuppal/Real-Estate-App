import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { offerRows } from "@/lib/dashboard-data";
import { DashboardHeader } from "@/components/dashboard/stat-card";
import { OfferList } from "@/components/features/manage/offer-list";

export const metadata: Metadata = { title: "Offers & applications" };

export default async function SeekerOffersPage() {
  const user = await requireRole(["seeker"]);
  const rows = await offerRows(await repo.offers.forSeeker(user.id), "seeker");
  return (
    <>
      <DashboardHeader eyebrow="Seeker" title="Offers & applications" description="Track every offer and rental application from submitted to decision." />
      <OfferList rows={rows} perspective="seeker" emptyText="You haven't made any offers yet. Use “Make an offer” on a listing." />
    </>
  );
}
