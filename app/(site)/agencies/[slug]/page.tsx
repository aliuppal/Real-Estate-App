import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";
import { repo } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const agency = await repo.agencies.findBySlug((await params).slug);
  return { title: agency?.name ?? "Agency not found" };
}

export default async function AgencyProfilePage({ params }: Props) {
  const agency = await repo.agencies.findBySlug((await params).slug);
  if (!agency) notFound();
  return (
    <ComingSoon
      icon={Building2}
      title={agency.name}
      description="The agency's team, listings and reviews."
      backHref="/agencies"
      backLabel="All agencies"
    />
  );
}
