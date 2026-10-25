import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { LISTER_ROLES } from "@/lib/auth/roles";
import { repo } from "@/lib/data";
import { DashboardHeader } from "@/components/dashboard/stat-card";
import { ListingWizard } from "@/components/features/wizard/listing-wizard";

export const metadata: Metadata = { title: "List a property" };

export default async function NewListingPage() {
  const user = await requireRole(LISTER_ROLES, "/dashboard/listings/new");
  const [areas, team] = await Promise.all([
    repo.neighbourhoods.list(),
    user.role === "agency_admin" && user.agencyId ? repo.agents.byAgency(user.agencyId) : Promise.resolve(null),
  ]);
  return (
    <div className="max-w-4xl">
      <DashboardHeader eyebrow="New listing" title="List a property" description="Seven short steps. Your progress is saved in this browser as you go." />
      <ListingWizard areas={areas.map((n) => ({ id: n.id, name: n.name, center: n.center }))}
        team={team?.filter((a) => a.verification === "verified").map((a) => ({ id: a.id, name: a.name }))} />
    </div>
  );
}
