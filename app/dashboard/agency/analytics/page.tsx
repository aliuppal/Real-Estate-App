import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { LEAD_STAGES, repo } from "@/lib/data";
import { leadStageLabels } from "@/lib/labels";
import { DashboardHeader, StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { SimpleBarChart } from "@/components/features/manage/bar-chart";

export const metadata: Metadata = { title: "Agency analytics" };

export default async function AgencyAnalyticsPage() {
  const user = await requireRole(["agency_admin"]);
  if (!user.agencyId) notFound();
  const [team, listings, leads] = await Promise.all([repo.agents.byAgency(user.agencyId), repo.listings.byAgency(user.agencyId), repo.leads.forAgency(user.agencyId)]);
  const live = listings.filter((l) => l.status === "active");
  const closed = leads.filter((l) => l.stage === "closed").length;
  const decided = leads.filter((l) => l.stage === "closed" || l.stage === "lost").length;
  const per = (fn: (agentId: string) => number) => team.map((a) => ({ label: a.name, value: fn(a.id) })).sort((a, b) => b.value - a.value);

  return (
    <>
      <DashboardHeader eyebrow="Agency admin" title="Analytics" description="One measure per chart; switch any chart to a table." />
      <StatGrid>
        <StatCard label="Live listings" value={live.length} />
        <StatCard label="Listing views" value={listings.reduce((s, l) => s + l.views, 0).toLocaleString("en-PK")} />
        <StatCard label="Open leads" value={leads.length - decided} />
        <StatCard label="Win rate" value={decided ? `${Math.round((closed / decided) * 100)}%` : "–"} hint={`${closed} closed of ${decided} decided`} />
      </StatGrid>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SimpleBarChart title="Leaderboard: deals closed" data={per((id) => team.find((a) => a.id === id)!.dealsClosed)} valueLabel="Deals" slot={1} />
        <SimpleBarChart title="Leads by stage" data={LEAD_STAGES.map((s) => ({ label: leadStageLabels[s], value: leads.filter((l) => l.stage === s).length }))} valueLabel="Leads" slot={2} />
        <SimpleBarChart title="Live listings per agent" data={per((id) => live.filter((l) => l.agentId === id).length)} valueLabel="Listings" slot={1} />
        <SimpleBarChart title="Listing views per agent" data={per((id) => listings.filter((l) => l.agentId === id).reduce((s, l) => s + l.views, 0))} valueLabel="Views" slot={3} />
      </div>
    </>
  );
}
