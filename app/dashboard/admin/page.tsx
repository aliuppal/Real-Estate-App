import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { formatRelativeDate } from "@/lib/format";
import { DashboardHeader, EmptyRow, Panel, Row, StatCard, StatGrid, StatusPill } from "@/components/dashboard/stat-card";

export const metadata: Metadata = { title: "Platform admin" };

export default async function AdminDashboard() {
  await requireRole(["admin"]);
  const [stats, agents, agencies, reports] = await Promise.all([
    repo.stats.platform(),
    repo.agents.list(),
    repo.agencies.list(),
    repo.reports.list(),
  ]);
  const queue = [
    ...agencies.filter((a) => a.verification === "pending").map((a) => ({ id: a.id, title: a.name, meta: "Agency", at: a.createdAt })),
    ...agents.filter((a) => a.verification === "pending").map((a) => ({ id: a.id, title: a.name, meta: "Agent", at: a.createdAt })),
  ];
  const open = reports.filter((r) => r.status === "open");
  const titles = Object.fromEntries((await repo.listings.findManyByIds(open.map((r) => r.listingId))).map((l) => [l.id, l.title]));

  return (
    <>
      <DashboardHeader eyebrow="Platform admin" title="Platform overview" />
      <StatGrid>
        <StatCard label="Users" value={stats.users} href="/dashboard/admin/users" />
        <StatCard label="Active listings" value={stats.activeListings} href="/dashboard/admin/moderation" />
        <StatCard label="Awaiting verification" value={stats.pendingVerifications} href="/dashboard/admin/verification" />
        <StatCard label="Open reports" value={stats.openReports} href="/dashboard/admin/reports" />
      </StatGrid>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Verification queue" href="/dashboard/admin/verification">
          {queue.length ? queue.map((q) => <Row key={q.id} title={q.title} meta={q.meta} aside={<StatusPill status="pending" />} />) : <EmptyRow>Queue is clear.</EmptyRow>}
        </Panel>
        <Panel title="Reported listings" href="/dashboard/admin/reports">
          {open.length ? open.map((r) => (
            <Row key={r.id} title={titles[r.listingId] ?? "Listing"} meta={r.reason} aside={<span className="text-xs text-muted-foreground">{formatRelativeDate(r.createdAt)}</span>} href={`/listings/${r.listingId}`} />
          )) : <EmptyRow>No open reports.</EmptyRow>}
        </Panel>
      </div>
    </>
  );
}
