import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { DashboardHeader } from "@/components/dashboard/stat-card";
import { AgencyProfileForm } from "@/components/features/manage/agency-profile-form";

export const metadata: Metadata = { title: "Agency profile" };

export default async function AgencyProfilePage() {
  const user = await requireRole(["agency_admin"]);
  const agency = user.agencyId ? await repo.agencies.findById(user.agencyId) : null;
  if (!agency) notFound();
  const areas = (await repo.neighbourhoods.list()).map((n) => ({ id: n.id, name: n.name }));
  return (
    <>
      <DashboardHeader eyebrow="Agency admin" title={agency.name}
        description={agency.verification === "verified" ? "Verified agency" : "Verification pending"}
        action={<Link href={`/agencies/${agency.slug}`} className="text-sm underline underline-offset-4">View public page</Link>} />
      <AgencyProfileForm agency={agency} areas={areas} />
    </>
  );
}
