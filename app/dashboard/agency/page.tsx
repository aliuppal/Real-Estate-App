import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { DashboardHeader, Panel, Row, StatCard, StatGrid, StatusPill } from "@/components/dashboard/stat-card";

export const metadata: Metadata = { title: "Agency dashboard" };

export default async function AgencyDashboard() {
  const user = await requireRole(["agency_admin"]);
  if (!user.agencyId) notFound();
  const [agency, team, listings, leads] = await Promise.all([
    repo.agencies.findById(user.agencyId),
    repo.agents.byAgency(user.agencyId),
    repo.listings.byAgency(user.agencyId),
    repo.leads.forAgency(user.agencyId),
  ]);
  if (!agency) notFound();
  const leaderboard = [...team].sort((a, b) => b.dealsClosed - a.dealsClosed);

  return (
    <>
      <DashboardHeader
        eyebrow="Agency admin"
        title={agency.name}
        description={agency.verification === "verified" ? "Verified agency" : "Verification pending. We'll review your agency within one working day."}
      />
      <StatGrid>
        <StatCard label="Agents" value={team.length} href="/dashboard/agency/team" />
        <StatCard label="Active listings" value={listings.filter((l) => l.status === "active").length} href="/dashboard/agency/listings" />
        <StatCard label="Open leads" value={leads.filter((l) => l.stage !== "closed" && l.stage !== "lost").length} />
        <StatCard label="Agency rating" value={agency.rating ? agency.rating.toFixed(1) : "–"} hint={`${agency.reviewCount} reviews`} />
      </StatGrid>
      <Panel title="Leaderboard" href="/dashboard/agency/team" linkLabel="Manage team" className="mt-6">
        {leaderboard.map((a, i) => (
          <Row
            key={a.id}
            title={`${i + 1}. ${a.name}`}
            meta={`${a.dealsClosed} deals · ${a.rating.toFixed(1)} rating · ${listings.filter((l) => l.agentId === a.id).length} listings`}
            aside={<StatusPill status={a.verification} />}
          />
        ))}
      </Panel>
    </>
  );
}
