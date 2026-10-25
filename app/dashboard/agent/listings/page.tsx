import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { managedListings } from "@/lib/dashboard-data";
import { buttonVariants } from "@/components/ui/button";
import { DashboardHeader } from "@/components/dashboard/stat-card";
import { ListingManager } from "@/components/features/manage/listing-manager";

export const metadata: Metadata = { title: "My listings" };

export default async function AgentListingsPage() {
  const user = await requireRole(["agent"]);
  if (!user.agentId) notFound();
  return (
    <>
      <DashboardHeader eyebrow="Agent" title="My listings"
        action={<Link href="/dashboard/listings/new" className={buttonVariants({ size: "xl" })}>New listing</Link>} />
      <ListingManager listings={await managedListings(await repo.listings.byAgent(user.agentId))} perspective="agent" emptyText="No listings yet." />
    </>
  );
}
