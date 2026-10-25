import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { DashboardHeader } from "@/components/dashboard/stat-card";
import { LeadBoard } from "@/components/features/manage/lead-board";

export const metadata: Metadata = { title: "Lead pipeline" };

export default async function AgentLeadsPage() {
  const user = await requireRole(["agent"]);
  if (!user.agentId) notFound();
  const leads = await repo.leads.forAgent(user.agentId);
  const listings = await repo.listings.findManyByIds([...new Set(leads.map((l) => l.listingId).filter((x): x is string => !!x))]);
  return (
    <>
      <DashboardHeader eyebrow="Agent" title="Lead pipeline" description="Drag leads between stages, or open one for contact details, notes and history." />
      <LeadBoard initial={leads} listingTitles={Object.fromEntries(listings.map((l) => [l.id, l.title]))} />
    </>
  );
}
