"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Listing } from "@/lib/data/types";
import { PropertyCard } from "@/components/features/listings/property-card";
import { cn } from "@/lib/utils";

interface Item {
  listing: Listing;
  neighbourhoodName: string;
}

/**
 * Native scroll-snap carousel. Scrolling itself is compositor-driven; the progress bar is a
 * `scaleX` transform written from rAF via a ref, so scrolling never triggers a React render.
 */
export function ListingCarousel({ items, label }: { items: Item[]; label: string }) {
  const track = useRef<HTMLUListElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const sync = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const progress = max > 0 ? el.scrollLeft / max : 1;
    const visible = el.clientWidth / el.scrollWidth;
    if (bar.current) bar.current.style.transform = `scaleX(${Math.min(1, visible + progress * (1 - visible))})`;
    const next = { start: el.scrollLeft < 4, end: el.scrollLeft > max - 4 };
    setEdges((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    };
    sync();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sync]);

  const page = (dir: 1 | -1) => {
    const el = track.current;
    const card = el?.querySelector("li");
    if (!el || !card) return;
    el.scrollBy({ left: dir * (card.getBoundingClientRect().width + 24) * (window.innerWidth >= 1024 ? 2 : 1), behavior: "smooth" });
  };

  const navButton = "grid size-11 place-items-center rounded-full border border-hairline transition-colors hover:bg-muted disabled:opacity-35 disabled:hover:bg-transparent";

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label}>
      <ul
        ref={track}
        className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-px-4 px-4 pb-6 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {items.map(({ listing, neighbourhoodName }, i) => (
          <li key={listing.id} className="w-[82%] shrink-0 snap-start sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
            <PropertyCard listing={listing} neighbourhoodName={neighbourhoodName} priority={i < 2} className="h-full" />
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center gap-6">
        <div className="relative h-px flex-1 overflow-hidden bg-hairline" aria-hidden>
          <span ref={bar} className="absolute inset-0 origin-left bg-foreground" style={{ transform: "scaleX(0.25)" }} />
        </div>
        <div className="flex gap-2">
          <button type="button" aria-label="Previous listings" disabled={edges.start} onClick={() => page(-1)} className={navButton}>
            <ArrowLeft className="size-4" />
          </button>
          <button type="button" aria-label="Next listings" disabled={edges.end} onClick={() => page(1)} className={cn(navButton)}>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
