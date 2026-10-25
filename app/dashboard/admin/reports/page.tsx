import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { DashboardHeader } from "@/components/dashboard/stat-card";
import { ReportList } from "@/components/features/manage/admin-panels";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  await requireRole(["admin"]);
  const reports = await repo.reports.list();
  const [listings, users] = await Promise.all([
    repo.listings.findManyByIds([...new Set(reports.map((r) => r.listingId))]),
    repo.users.findManyByIds(reports.map((r) => r.reporterId).filter((x): x is string => !!x)),
  ]);
  const rows = reports.map((r) => ({
    ...r,
    listingTitle: listings.find((l) => l.id === r.listingId)?.title ?? "Listing",
    reporterName: users.find((u) => u.id === r.reporterId)?.name ?? null,
  }));
  return (
    <>
      <DashboardHeader eyebrow="Platform admin" title="Reported content" description="Take a listing down from Moderation, then resolve the report here." />
      <ReportList reports={rows} />
    </>
  );
}
