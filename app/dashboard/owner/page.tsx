import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { DashboardHeader, EmptyRow, Panel, Row, StatCard, StatGrid, StatusPill } from "@/components/dashboard/stat-card";

export const metadata: Metadata = { title: "Your listings" };

export default async function OwnerDashboard() {
  const user = await requireRole(["owner"]);
  const listings = await repo.listings.byOwner(user.id);
  const sum = (key: "views" | "saves" | "enquiries") => listings.reduce((s, l) => s + l[key], 0);

  return (
    <>
      <DashboardHeader
        eyebrow="Owner / Seller"
        title="Your properties"
        description="How your listings are doing, and what needs your attention."
        action={<Link href="/dashboard/listings/new" className={buttonVariants({ size: "xl" })}>List a property</Link>}
      />
      <StatGrid>
        <StatCard label="Active listings" value={listings.filter((l) => l.status === "active").length} hint={`${listings.length} in total`} href="/dashboard/owner/listings" />
        <StatCard label="Views" value={sum("views").toLocaleString("en-PK")} />
        <StatCard label="Saves" value={sum("saves").toLocaleString("en-PK")} />
        <StatCard label="Enquiries" value={sum("enquiries")} href="/dashboard/messages" />
      </StatGrid>
      <Panel title="Listings" href="/dashboard/owner/listings" className="mt-6">
        {listings.length ? listings.map((l) => (
          <Row
            key={l.id}
            title={l.title}
            meta={`${formatPrice(l.price, { compact: true, purpose: l.purpose })} · ${l.views.toLocaleString("en-PK")} views · ${l.enquiries} enquiries${l.agentId ? " · handled by an agent" : ""}`}
            aside={<StatusPill status={l.status} />}
            href={`/listings/${l.id}`}
          />
        )) : <EmptyRow>No listings yet. List your first property in a few minutes.</EmptyRow>}
      </Panel>
    </>
  );
}
