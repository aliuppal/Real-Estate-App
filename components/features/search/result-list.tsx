"use client";

import { useEffect, useRef } from "react";
import { SearchX } from "lucide-react";
import type { Listing } from "@/lib/data/types";
import { PropertyCard } from "@/components/features/listings/property-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ResultListProps {
  listings: Listing[];
  nbNames: Record<string, string>;
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onClearFilters: () => void;
  columns: "split" | "full";
}

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-media border border-border">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-2.5 p-5">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-6 w-1/3" />
      </div>
    </div>
  );
}

/** Results grid with infinite scroll (IntersectionObserver) and a manual "Load more" fallback. */
export function ResultList(props: ResultListProps) {
  const { listings, nbNames, isLoading, isFetchingMore, hasMore, onLoadMore, hoveredId, onHover, onClearFilters, columns } = props;
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && !isFetchingMore) onLoadMore(); }, { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, isFetchingMore, onLoadMore]);

  const grid = cn("grid gap-5 sm:grid-cols-2", columns === "full" ? "lg:grid-cols-3 xl:grid-cols-4" : "xl:grid-cols-2");

  if (isLoading) {
    return <div className={grid} aria-busy="true" aria-label="Loading homes">{Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}</div>;
  }

  if (!listings.length) {
    return (
      <div className="flex flex-col items-center rounded-media border border-dashed border-hairline px-6 py-16 text-center">
        <SearchX className="size-8 text-meta" strokeWidth={1.4} aria-hidden />
        <h2 className="mt-4 text-2xl">No homes match all of that</h2>
        <p className="mt-2 max-w-sm text-muted-foreground">Try removing a filter or two, widening the price range, or drawing a bigger area.</p>
        <Button variant="outline" size="xl" className="mt-6" onClick={onClearFilters}>Clear all filters</Button>
      </div>
    );
  }

  return (
    <>
      <ul className={grid}>
        {listings.map((l, i) => (
          <li key={l.id}>
            <PropertyCard
              listing={l}
              neighbourhoodName={nbNames[l.neighbourhoodId] ?? ""}
              priority={i < 2}
              className="h-full"
              active={hoveredId === l.id}
              onHoverChange={(h) => onHover(h ? l.id : null)}
            />
          </li>
        ))}
        {isFetchingMore && Array.from({ length: 2 }, (_, i) => <li key={`s${i}`}><CardSkeleton /></li>)}
      </ul>
      <div ref={sentinel} className="flex justify-center py-8">
        {hasMore ? (
          <Button variant="outline" size="xl" onClick={onLoadMore} disabled={isFetchingMore}>
            {isFetchingMore ? "Loading…" : "Load more homes"}
          </Button>
        ) : (
          <p className="mono-label text-meta">That&apos;s everything</p>
        )}
      </div>
    </>
  );
}
