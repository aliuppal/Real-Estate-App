import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { DashboardHeader } from "@/components/dashboard/stat-card";
import { TeamManager } from "@/components/features/manage/team-manager";
import { LeadBoard } from "@/components/features/manage/lead-board";

export const metadata: Metadata = { title: "Team" };

export default async function AgencyTeamPage() {
  const user = await requireRole(["agency_admin"]);
  if (!user.agencyId) notFound();
  const [team, listings, leads] = await Promise.all([repo.agents.byAgency(user.agencyId), repo.listings.byAgency(user.agencyId), repo.leads.forAgency(user.agencyId)]);
  const open = (id: string) => leads.filter((l) => l.agentId === id && l.stage !== "closed" && l.stage !== "lost").length;
  const rows = [...team].sort((a, b) => b.dealsClosed - a.dealsClosed).map((a) => ({ ...a, listings: listings.filter((l) => l.agentId === a.id).length, openLeads: open(a.id) }));
  const titles = await repo.listings.findManyByIds([...new Set(leads.map((l) => l.listingId).filter((x): x is string => !!x))]);

  return (
    <>
      <DashboardHeader eyebrow="Agency admin" title="Team" description="Invite or remove agents. Open any lead below to reassign it." />
      <TeamManager team={rows} />
      <section aria-labelledby="team-leads" className="mt-12">
        <h2 id="team-leads" className="mb-4 text-2xl">Leads across the team</h2>
        <LeadBoard initial={leads} listingTitles={Object.fromEntries(titles.map((l) => [l.id, l.title]))}
          agentNames={Object.fromEntries(team.map((a) => [a.id, a.name]))} team={team.map((a) => ({ id: a.id, name: a.name }))} />
      </section>
    </>
  );
}
