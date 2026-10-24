import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { LEAD_STAGES, repo } from "@/lib/data";
import { formatPrice, formatResponseTime } from "@/lib/format";
import { leadStageLabels } from "@/lib/labels";
import { DashboardHeader, EmptyRow, Panel, Row, StatCard, StatGrid, StatusPill } from "@/components/dashboard/stat-card";

export const metadata: Metadata = { title: "Agent dashboard" };

export default async function AgentDashboard() {
  const user = await requireRole(["agent"]);
  if (!user.agentId) notFound();
  const [agent, leads, viewings, listings] = await Promise.all([
    repo.agents.findById(user.agentId),
    repo.leads.forAgent(user.agentId),
    repo.viewings.forAgent(user.agentId),
    repo.listings.byAgent(user.agentId),
  ]);
  if (!agent) notFound();
  const upcoming = viewings.filter((v) => v.status !== "cancelled" && new Date(v.start) > new Date());
  const titles = Object.fromEntries((await repo.listings.findManyByIds(upcoming.map((v) => v.listingId))).map((l) => [l.id, l.title]));
  const openLeads = leads.filter((l) => l.stage !== "closed" && l.stage !== "lost");

  return (
    <>
      <DashboardHeader eyebrow={agent.title} title={agent.name} description={`Replying ${formatResponseTime(agent.avgResponseMins)} on average · ${agent.dealsClosed} deals closed`} />
      <StatGrid>
        <StatCard label="Open leads" value={openLeads.length} hint={`${leads.filter((l) => l.stage === "new").length} new`} href="/dashboard/agent/leads" />
        <StatCard label="Upcoming viewings" value={upcoming.length} href="/dashboard/agent/calendar" />
        <StatCard label="Active listings" value={listings.filter((l) => l.status === "active").length} href="/dashboard/agent/listings" />
        <StatCard label="Rating" value={agent.rating.toFixed(1)} hint={`${agent.reviewCount} reviews`} href="/dashboard/agent/reviews" />
      </StatGrid>

      <Panel title="Pipeline" href="/dashboard/agent/leads" linkLabel="Open board" className="mt-6">
        <ol className="grid grid-cols-3 gap-2 p-2 md:grid-cols-6">
          {LEAD_STAGES.map((stage) => (
            <li key={stage} className="rounded-lg bg-muted p-3">
              <p className="mono-label text-[0.625rem] text-meta">{leadStageLabels[stage]}</p>
              <p className="tabular mt-2 font-display text-3xl">{leads.filter((l) => l.stage === stage).length}</p>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Newest leads" href="/dashboard/agent/leads">
          {openLeads.slice(0, 5).map((l) => (
            <Row key={l.id} title={l.name} meta={`${l.source.replace("_", " ")}${l.budget ? ` · budget ${formatPrice(l.budget, { compact: true })}` : ""}`} aside={<StatusPill status={l.stage} />} />
          ))}
        </Panel>
        <Panel title="Upcoming viewings" href="/dashboard/agent/calendar">
          {upcoming.length ? upcoming.map((v) => (
            <Row key={v.id} title={titles[v.listingId] ?? "Listing"} meta={new Date(v.start).toLocaleString("en-PK", { weekday: "short", hour: "numeric", minute: "2-digit" })} aside={<StatusPill status={v.status} />} />
          )) : <EmptyRow>Nothing booked.</EmptyRow>}
        </Panel>
      </div>
    </>
  );
}
