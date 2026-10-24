import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { formatPrice, formatRelativeDate } from "@/lib/format";
import { DashboardHeader, EmptyRow, Panel, Row, StatCard, StatGrid, StatusPill } from "@/components/dashboard/stat-card";

export const metadata: Metadata = { title: "Your dashboard" };

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-PK", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default async function SeekerDashboard() {
  const user = await requireRole(["seeker"]);
  const [collections, searches, viewings, offers, notifications] = await Promise.all([
    repo.collections.forUser(user.id),
    repo.savedSearches.forUser(user.id),
    repo.viewings.forSeeker(user.id),
    repo.offers.forSeeker(user.id),
    repo.notifications.forUser(user.id),
  ]);
  const savedIds = [...new Set(collections.flatMap((c) => c.listingIds))];
  const upcoming = viewings.filter((v) => v.status !== "cancelled" && v.status !== "completed" && new Date(v.start) > new Date());
  const related = await repo.listings.findManyByIds([...new Set([...upcoming, ...offers].map((x) => x.listingId))]);
  const title = (id: string) => related.find((l) => l.id === id)?.title ?? "Listing";

  return (
    <>
      <DashboardHeader eyebrow="Seeker" title={`Salaam, ${user.name.split(" ")[0]}`} description="Your shortlist, viewings and offers in one place." />
      <StatGrid>
        <StatCard label="Saved homes" value={savedIds.length} hint={`${collections.length} collections`} href="/dashboard/seeker/saved" />
        <StatCard label="Saved searches" value={searches.length} hint={`${searches.filter((s) => s.alertsEnabled).length} with alerts on`} href="/dashboard/seeker/searches" />
        <StatCard label="Upcoming viewings" value={upcoming.length} href="/dashboard/seeker/viewings" />
        <StatCard label="Open offers" value={offers.filter((o) => o.status === "submitted" || o.status === "reviewing").length} href="/dashboard/seeker/offers" />
      </StatGrid>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Upcoming viewings" href="/dashboard/seeker/viewings">
          {upcoming.length ? upcoming.map((v) => (
            <Row key={v.id} title={title(v.listingId)} meta={when(v.start)} aside={<StatusPill status={v.status} />} href={`/listings/${v.listingId}`} />
          )) : <EmptyRow>No viewings booked yet.</EmptyRow>}
        </Panel>
        <Panel title="Offers & applications" href="/dashboard/seeker/offers">
          {offers.length ? offers.map((o) => (
            <Row key={o.id} title={title(o.listingId)} meta={`${o.kind === "offer" ? "Offer" : "Rental application"} · ${formatPrice(o.amount, { compact: true })}`}
              aside={<StatusPill status={o.status} />} href={`/listings/${o.listingId}`} />
          )) : <EmptyRow>You haven&apos;t made an offer yet.</EmptyRow>}
        </Panel>
        <Panel title="Latest notifications" href="/dashboard/notifications" className="lg:col-span-2">
          {notifications.slice(0, 4).map((n) => (
            <Row key={n.id} title={n.title} meta={n.body} aside={<span className="text-xs text-muted-foreground">{formatRelativeDate(n.createdAt)}</span>} href={n.href ?? undefined} />
          ))}
        </Panel>
      </div>
    </>
  );
}
