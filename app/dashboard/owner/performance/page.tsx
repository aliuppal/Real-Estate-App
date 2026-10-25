import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { DashboardHeader, StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { SimpleBarChart } from "@/components/features/manage/bar-chart";

export const metadata: Metadata = { title: "Listing performance" };

const short = (t: string) => (t.length > 26 ? `${t.slice(0, 25)}…` : t);

export default async function OwnerPerformancePage() {
  const user = await requireRole(["owner"]);
  const listings = (await repo.listings.byOwner(user.id)).filter((l) => l.status !== "draft");
  const sum = (k: "views" | "saves" | "enquiries") => listings.reduce((s, l) => s + l[k], 0);
  const series = (k: "views" | "saves" | "enquiries") => [...listings].sort((a, b) => b[k] - a[k]).map((l) => ({ label: short(l.title), value: l[k] }));

  return (
    <>
      <DashboardHeader eyebrow="Owner / Seller" title="Performance" description="Views, saves and enquiries for each listing. Each measure has its own chart, since they differ in scale." />
      <StatGrid>
        <StatCard label="Views" value={sum("views").toLocaleString("en-PK")} />
        <StatCard label="Saves" value={sum("saves")} hint={`${((sum("saves") / Math.max(1, sum("views"))) * 100).toFixed(1)}% of views`} />
        <StatCard label="Enquiries" value={sum("enquiries")} hint={`${((sum("enquiries") / Math.max(1, sum("views"))) * 100).toFixed(1)}% of views`} />
        <StatCard label="Live listings" value={listings.filter((l) => l.status === "active").length} />
      </StatGrid>
      {listings.length ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <SimpleBarChart title="Views" data={series("views")} valueLabel="Views" slot={1} />
          <SimpleBarChart title="Saves" data={series("saves")} valueLabel="Saves" slot={2} />
          <SimpleBarChart title="Enquiries" data={series("enquiries")} valueLabel="Enquiries" slot={3} />
        </div>
      ) : <p className="mt-6 text-muted-foreground">Publish a listing to see how it performs.</p>}
    </>
  );
}
