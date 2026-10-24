import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UserRound } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";
import { repo } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const agent = await repo.agents.findBySlug((await params).slug);
  return { title: agent?.name ?? "Agent not found" };
}

export default async function AgentProfilePage({ params }: Props) {
  const agent = await repo.agents.findBySlug((await params).slug);
  if (!agent) notFound();
  return (
    <ComingSoon
      icon={UserRound}
      title={agent.name}
      description="Bio, stats, active listings, reviews and a map of the areas this agent covers."
      backHref="/agents"
      backLabel="All agents"
    />
  );
}
