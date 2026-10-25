import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { managedListings, nbNameMap } from "@/lib/dashboard-data";
import { rankAgents } from "@/lib/matching";
import { buttonVariants } from "@/components/ui/button";
import { DashboardHeader } from "@/components/dashboard/stat-card";
import { ListingManager } from "@/components/features/manage/listing-manager";
import type { HandoverMatch } from "@/components/features/manage/handover-dialog";

export const metadata: Metadata = { title: "My listings" };

export default async function OwnerListingsPage() {
  const user = await requireRole(["owner"]);
  const [listings, agents, names] = await Promise.all([repo.listings.byOwner(user.id), repo.agents.list(), nbNameMap()]);

  // Matched agents for each listing the owner still handles alone.
  const handover: Record<string, HandoverMatch[]> = {};
  for (const l of listings.filter((x) => !x.agentId)) {
    handover[l.id] = rankAgents(agents, {
      goal: l.purpose === "rent" ? "rent" : "sell", neighbourhoodId: l.neighbourhoodId, budget: l.price,
      timeline: "1-3m", propertyType: l.type, language: null,
    }, names[l.neighbourhoodId], 4).map((m) => ({ agentId: m.agent.id, name: m.agent.name, photo: m.agent.photo, score: m.score, reason: m.reasons[0] ?? m.agent.title }));
  }

  return (
    <>
      <DashboardHeader eyebrow="Owner / Seller" title="My listings" description="Change status or price, or hand a listing over to a matched agent."
        action={<Link href="/dashboard/listings/new" className={buttonVariants({ size: "xl" })}>List a property</Link>} />
      <ListingManager listings={await managedListings(listings)} perspective="owner" handover={handover} emptyText="You haven't listed anything yet." />
    </>
  );
}
