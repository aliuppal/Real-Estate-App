"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery, useQuery, keepPreviousData } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { List, Map as MapIcon, X } from "lucide-react";
import type { Listing, Page, SearchFilters } from "@/lib/data/types";
import { filtersToSearchParams, searchParamsToFilters } from "@/lib/search/params";
import { formatPrice } from "@/lib/format";
import { getJson } from "@/lib/realtime";
import type { Pin } from "@/app/api/listings/pins/route";
import { cn } from "@/lib/utils";
import { ResultList } from "./result-list";
import { SearchToolbar, type ViewMode } from "./toolbar";

// Leaflet touches `window`, so the map only renders in the browser.
const SearchMap = dynamic(() => import("./search-map"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-muted" aria-label="Loading map" />,
});

const PAGE_SIZE = 12;

function useIsDesktop() {
  const [desktop, setDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return desktop;
}

interface SearchViewProps {
  initialPage: Page<Listing>;
  initialQuery: string;
  neighbourhoods: { id: string; name: string }[];
}

/** Search page: URL-synced filters, infinite results, and a clustered map that highlights in sync. */
export function SearchView({ initialPage, initialQuery, neighbourhoods }: SearchViewProps) {
  const router = useRouter();
  const params = useSearchParams();
  const isDesktop = useIsDesktop();
  const [view, setView] = useState<ViewMode>("split");
  const [mobileMap, setMobileMap] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filters = useMemo(() => searchParamsToFilters(new URLSearchParams(params.toString())), [params]);
  const qs = filtersToSearchParams(filters).toString();
  const nbNames = useMemo(() => Object.fromEntries(neighbourhoods.map((n) => [n.id, n.name])), [neighbourhoods]);

  const setFilters = useCallback((next: SearchFilters) => {
    const q = filtersToSearchParams(next).toString();
    setSelectedId(null);
    router.replace(q ? `/search?${q}` : "/search", { scroll: false });
  }, [router]);

  const results = useInfiniteQuery({
    queryKey: ["search", qs],
    queryFn: ({ pageParam }) => getJson<Page<Listing>>(`/api/listings?${qs}&page=${pageParam}&pageSize=${PAGE_SIZE}`),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
    initialData: qs === initialQuery ? { pages: [initialPage], pageParams: [1] } : undefined,
    placeholderData: keepPreviousData,
  });
  const pins = useQuery({ queryKey: ["pins", qs], queryFn: () => getJson<Pin[]>(`/api/listings/pins?${qs}`), placeholderData: keepPreviousData });

  const listings = results.data?.pages.flatMap((p) => p.items) ?? [];
  const total = results.data?.pages[0]?.total ?? null;
  const selected = pins.data?.find((p) => p.id === selectedId) ?? null;

  const onSelect = (id: string | null) => {
    setSelectedId(id);
    if (id) document.querySelector(`[data-listing-id="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const showList = isDesktop ? view !== "map" : !mobileMap;
  const showMap = isDesktop ? view !== "list" : mobileMap;

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] flex-col md:h-[calc(100dvh-4rem)]">
      <SearchToolbar filters={filters} onChange={setFilters} total={total} nbNames={nbNames} neighbourhoods={neighbourhoods}
        view={view} onViewChange={setView} isDesktop={isDesktop} />

      <div className={cn("grid min-h-0 flex-1", showList && showMap && "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]")}>
        {showList && (
          <section aria-label="Search results" className="min-h-0 overflow-y-auto px-4 py-5 sm:px-6">
            <ResultList
              listings={listings}
              nbNames={nbNames}
              isLoading={results.isPending}
              isFetchingMore={results.isFetchingNextPage}
              hasMore={!!results.hasNextPage}
              onLoadMore={() => void results.fetchNextPage()}
              hoveredId={hoveredId ?? selectedId}
              onHover={setHoveredId}
              onClearFilters={() => setFilters({ sort: filters.sort })}
              columns={showMap ? "split" : "full"}
            />
          </section>
        )}
        {showMap && (
          <section aria-label="Map" className="relative min-h-0 border-l border-border">
            <SearchMap pins={pins.data ?? []} hoveredId={hoveredId} selectedId={selectedId} onHover={setHoveredId} onSelect={onSelect}
              polygon={filters.polygon} onPolygonChange={(polygon) => setFilters({ ...filters, polygon })}>
              <AnimatePresence>
                {selected && (
                  <motion.div key={selected.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-x-3 bottom-3 z-[1000] mx-auto flex max-w-md items-center gap-3 rounded-xl bg-card p-2 shadow-xl ring-1 ring-hairline">
                    {selected.image && <Image src={selected.image} alt="" width={96} height={72} className="h-[72px] w-24 rounded-lg object-cover" />}
                    <div className="min-w-0 flex-1">
                      <p className="tabular font-medium">{formatPrice(selected.price, { compact: true, purpose: selected.purpose })}</p>
                      <Link href={`/listings/${selected.id}`} className="line-clamp-1 text-sm underline-offset-4 hover:underline">{selected.title}</Link>
                      <p className="text-xs text-muted-foreground">{nbNames[selected.neighbourhoodId]}{selected.beds ? ` · ${selected.beds} bed` : ""}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedId(null)} aria-label="Close preview" className="grid size-8 place-items-center rounded-full hover:bg-muted">
                      <X className="size-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </SearchMap>
          </section>
        )}
      </div>

      {!isDesktop && (
        <button type="button" onClick={() => setMobileMap((m) => !m)}
          className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-1/2 z-40 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground shadow-lg">
          {mobileMap ? <><List className="size-4" aria-hidden /> Show list</> : <><MapIcon className="size-4" aria-hidden /> Show map</>}
        </button>
      )}
    </div>
  );
}
