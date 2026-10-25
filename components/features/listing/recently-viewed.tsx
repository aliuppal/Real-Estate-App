"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Listing } from "@/lib/data/types";
import { PropertyCard } from "@/components/features/listings/property-card";
import { getJson } from "@/lib/realtime";

const KEY = "nestly:recent";
const MAX = 12;

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Remembers this listing as most recently viewed (per browser, local only). */
export function RecordView({ listingId }: { listingId: string }) {
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify([listingId, ...read().filter((id) => id !== listingId)].slice(0, MAX)));
    } catch {
      // Storage unavailable (private mode); recently viewed simply stays empty.
    }
  }, [listingId]);
  return null;
}

export function RecentlyViewed({ excludeId, nbNames, title = "Recently viewed" }: { excludeId?: string; nbNames: Record<string, string>; title?: string }) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    setIds(read().filter((id) => id !== excludeId).slice(0, 4));
  }, [excludeId]);
  const { data } = useQuery({
    queryKey: ["recent", ids],
    queryFn: () => getJson<{ items: Listing[] }>(`/api/listings?ids=${ids.join(",")}`),
    enabled: ids.length > 0,
  });
  if (!data?.items.length) return null;

  return (
    <section aria-labelledby="recent-heading">
      <h2 id="recent-heading" className="mb-6 text-3xl">{title}</h2>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {data.items.map((l) => <li key={l.id}><PropertyCard listing={l} neighbourhoodName={nbNames[l.neighbourhoodId] ?? ""} className="h-full" /></li>)}
      </ul>
    </section>
  );
}
