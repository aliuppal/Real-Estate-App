import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { managedListings } from "@/lib/dashboard-data";
import { buttonVariants } from "@/components/ui/button";
import { DashboardHeader } from "@/components/dashboard/stat-card";
import { ListingManager } from "@/components/features/manage/listing-manager";

export const metadata: Metadata = { title: "Agency listings" };

export default async function AgencyListingsPage() {
  const user = await requireRole(["agency_admin"]);
  if (!user.agencyId) notFound();
  return (
    <>
      <DashboardHeader eyebrow="Agency admin" title="All listings"
        action={<Link href="/dashboard/listings/new" className={buttonVariants({ size: "xl" })}>New listing</Link>} />
      <ListingManager listings={await managedListings(await repo.listings.byAgency(user.agencyId), true)} perspective="agency" emptyText="Your agents haven't listed anything yet." />
    </>
  );
}
