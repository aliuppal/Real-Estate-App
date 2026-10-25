import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { DashboardHeader } from "@/components/dashboard/stat-card";
import { Reviews } from "@/components/features/directory/reviews";

export const metadata: Metadata = { title: "Reviews" };

export default async function AgentReviewsPage() {
  const user = await requireRole(["agent"]);
  const agent = user.agentId ? await repo.agents.findById(user.agentId) : null;
  if (!agent) notFound();
  return (
    <>
      <DashboardHeader eyebrow="Agent" title="Reviews"
        action={<Link href={`/agents/${agent.slug}`} className="text-sm underline underline-offset-4">View public profile</Link>} />
      <div className="rounded-media border border-border bg-card p-6 sm:p-8">
        <Reviews reviews={await repo.reviews.forTarget("agent", agent.id)} rating={agent.rating} />
      </div>
    </>
  );
}
