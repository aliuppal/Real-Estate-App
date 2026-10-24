import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Home } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";
import { repo } from "@/lib/data";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await repo.listings.findById((await params).id);
  return { title: listing?.title ?? "Listing not found" };
}

export default async function ListingPage({ params }: Props) {
  const listing = await repo.listings.findById((await params).id);
  if (!listing || listing.status === "draft") notFound();

  return (
    <ComingSoon
      icon={Home}
      title={listing.title}
      description="Gallery and lightbox, price history, mortgage and move-in calculators, neighbourhood scores and the contact card."
      backHref="/"
    />
  );
}
