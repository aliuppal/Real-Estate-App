import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { repo, type Listing } from "@/lib/data";
import { nbNameMap } from "@/lib/dashboard-data";
import { formatArea, formatPrice, plotSizeLabel } from "@/lib/format";
import { amenityLabels, typeLabels } from "@/lib/labels";
import { pricePerSqft } from "@/lib/search/filter";
import { DashboardHeader } from "@/components/dashboard/stat-card";

export const metadata: Metadata = { title: "Compare homes" };

type Props = { searchParams: Promise<{ ids?: string }> };

export default async function ComparePage({ searchParams }: Props) {
  const user = await requireRole(["seeker"]);
  const { ids } = await searchParams;
  const saved = new Set((await repo.collections.forUser(user.id)).flatMap((c) => c.listingIds));
  const chosen = (ids?.split(",") ?? [...saved]).filter((id) => saved.has(id)).slice(0, 4);
  const listings = await repo.listings.findManyByIds(chosen);
  const nb = await nbNameMap();

  const rows: [string, (l: Listing) => React.ReactNode][] = [
    ["Price", (l) => <span className="tabular text-lg">{formatPrice(l.price, { compact: true, purpose: l.purpose })}</span>],
    ["Price / sq ft", (l) => <span className="tabular">{formatPrice(Math.round(pricePerSqft(l)))}</span>],
    ["Type", (l) => `${typeLabels[l.type]} · ${l.purpose === "rent" ? "Rent" : "Sale"}`],
    ["Area", (l) => nb[l.neighbourhoodId]],
    ["Size", (l) => `${formatArea(l.areaSqft, "sqft")}${l.plotSqft ? ` · ${plotSizeLabel(l.plotSqft)}` : ""}`],
    ["Bedrooms", (l) => l.beds || "–"],
    ["Bathrooms", (l) => l.baths || "–"],
    ["Parking", (l) => l.parking || "–"],
    ["Built", (l) => l.yearBuilt ?? "–"],
    ["Furnished", (l) => (l.furnished ? "Yes" : "No")],
    ["Amenities", (l) => <span className="text-xs">{l.amenities.map((a) => amenityLabels[a]).join(", ")}</span>],
    ["Listed by", (l) => (l.listedBy === "agent" ? "Agent" : "Owner")],
  ];

  return (
    <>
      <DashboardHeader eyebrow="Seeker" title="Compare" description="Pick homes on your Saved page, then compare them here." />
      {listings.length < 2 ? (
        <p className="rounded-media border border-dashed border-hairline py-16 text-center text-muted-foreground">
          Choose at least two saved homes to compare. <Link href="/dashboard/seeker/saved" className="underline underline-offset-4">Go to saved homes</Link>
        </p>
      ) : (
        <div className="overflow-x-auto rounded-media border border-border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr>
                <th className="w-32 p-4" />
                {listings.map((l) => (
                  <th key={l.id} scope="col" className="p-4 text-left align-top font-normal">
                    <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-lg bg-muted"><Image src={l.images[0]} alt="" fill sizes="25vw" className="object-cover" /></div>
                    <Link href={`/listings/${l.id}`} className="line-clamp-2 underline-offset-4 hover:underline">{l.title}</Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, cell]) => (
                <tr key={label} className="border-t border-border">
                  <th scope="row" className="p-4 text-left align-top font-normal text-muted-foreground">{label}</th>
                  {listings.map((l) => <td key={l.id} className="p-4 align-top">{cell(l)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
