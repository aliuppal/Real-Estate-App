import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { DashboardHeader } from "@/components/dashboard/stat-card";
import { VerificationQueue, type QueueItem } from "@/components/features/manage/admin-panels";

export const metadata: Metadata = { title: "Verification queue" };

export default async function VerificationPage() {
  await requireRole(["admin"]);
  const [agents, agencies] = await Promise.all([repo.agents.list(), repo.agencies.list()]);
  const agencyName = Object.fromEntries(agencies.map((a) => [a.id, a.name]));
  const items: QueueItem[] = [
    ...agencies.filter((a) => a.verification === "pending").map((a) => ({ kind: "agency" as const, id: a.id, name: a.name, detail: `${a.email} · ${a.phone}`, href: `/agencies/${a.slug}`, createdAt: a.createdAt })),
    ...agents.filter((a) => a.verification === "pending").map((a) => ({ kind: "agent" as const, id: a.id, name: a.name, detail: `${a.title}${a.agencyId ? ` · ${agencyName[a.agencyId]}` : " · Independent"} · ${a.email}`, href: `/agents/${a.slug}`, createdAt: a.createdAt })),
  ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return (
    <>
      <DashboardHeader eyebrow="Platform admin" title="Verification queue" description="Approve agents and agencies, or reject with a reason they'll see." />
      <VerificationQueue items={items} />
    </>
  );
}
