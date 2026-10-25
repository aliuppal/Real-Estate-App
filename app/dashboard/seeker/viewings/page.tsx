import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { viewingRows } from "@/lib/dashboard-data";
import { DashboardHeader } from "@/components/dashboard/stat-card";
import { ViewingList } from "@/components/features/manage/viewing-list";

export const metadata: Metadata = { title: "Viewings" };

export default async function SeekerViewingsPage() {
  const user = await requireRole(["seeker"]);
  const rows = await viewingRows(await repo.viewings.forSeeker(user.id), "seeker");
  return (
    <>
      <DashboardHeader eyebrow="Seeker" title="Viewings" description="Times are Lahore time. You'll be notified when a request is confirmed." />
      <ViewingList rows={rows} perspective="seeker" />
    </>
  );
}
