import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Bath, BedDouble, Ruler } from "lucide-react";
import type { Listing } from "@/lib/data/types";
import { formatArea, formatPrice, plotSizeLabel } from "@/lib/format";
import { isNew, priceDrop } from "@/lib/search/filter";
import { typeLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
  listing: Listing;
  neighbourhoodName: string;
  priority?: boolean;
  className?: string;
}

const Fact = ({ icon: Icon, children }: { icon: typeof BedDouble; children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 text-[0.8rem] text-muted-foreground">
    <Icon className="size-3.5" strokeWidth={1.6} aria-hidden />
    {children}
  </span>
);

/**
 * Listing card. Hover: the image scales (transform) and a pre-painted shadow fades in (`.lift`),
 * so nothing re-lays-out or repaints per frame. Phase 2 adds the image carousel and save heart.
 */
export function PropertyCard({ listing: l, neighbourhoodName, priority, className }: PropertyCardProps) {
  const drop = priceDrop(l);
  const size = l.plotSqft ? plotSizeLabel(l.plotSqft) : formatArea(l.areaSqft, "sqft");

  return (
    <article className={cn("lift group flex flex-col rounded-media border border-border bg-card", className)}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-[inherit] bg-muted">
        <Image
          src={l.images[0]}
          alt={`${l.title}, ${neighbourhoodName}`}
          fill
          priority={priority}
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
          className="object-cover transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:scale-[1.05]"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {isNew(l) && <span className="mono-label rounded-full bg-white px-2.5 py-1 text-[0.6875rem] text-[#17171c]">New</span>}
          {drop && <span className="mono-label rounded-full bg-cta px-2.5 py-1 text-[0.6875rem] text-cta-foreground">Price drop</span>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <p className="mono-label text-meta">
          {typeLabels[l.type]} · {l.purpose === "rent" ? "For rent" : "For sale"} · {neighbourhoodName}
        </p>
        <h3 className="line-clamp-1 text-[1.0625rem] leading-snug">
          <Link href={`/listings/${l.id}`} className="after:absolute after:inset-0 after:z-10 after:rounded-media focus-visible:outline-none">
            {l.title}
          </Link>
        </h3>
        <div className="flex items-baseline justify-between gap-3">
          <p className="tabular text-xl font-medium tracking-[-0.01em]">{formatPrice(l.price, { compact: true, purpose: l.purpose })}</p>
          {l.verified && (
            <span className="inline-flex items-center gap-1 text-xs text-brand dark:text-[#4cc3a4]">
              <BadgeCheck className="size-4" strokeWidth={1.8} aria-hidden /> Verified
            </span>
          )}
        </div>
        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3">
          {l.beds > 0 && <Fact icon={BedDouble}>{l.beds} bed</Fact>}
          {l.baths > 0 && <Fact icon={Bath}>{l.baths} bath</Fact>}
          <Fact icon={Ruler}>{size}</Fact>
        </div>
      </div>
    </article>
  );
}
