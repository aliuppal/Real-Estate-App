"use client";

import dynamic from "next/dynamic";
import { GraduationCap, Hospital, Landmark, ShoppingBag, Trees, type LucideIcon } from "lucide-react";
import type { GeoPoint } from "@/lib/data/types";
import type { NearbyPlace } from "@/lib/nearby";

const LocationMap = dynamic(() => import("./location-map"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-muted" aria-label="Loading map" />,
});

const ICONS: Record<NearbyPlace["kind"], LucideIcon> = {
  school: GraduationCap, hospital: Hospital, mosque: Landmark, park: Trees, market: ShoppingBag,
};

export function Location({ location, places, address, title }: { location: GeoPoint; places: NearbyPlace[]; address: string; title: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="h-80 overflow-hidden rounded-media border border-border lg:h-auto lg:min-h-80" role="region" aria-label={`Map showing ${address}`}>
        <LocationMap location={location} places={places} title={title} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{address}</p>
        <ul className="mt-4 divide-y divide-border">
          {places.map((p) => {
            const Icon = ICONS[p.kind];
            return (
              <li key={p.kind} className="flex items-center gap-3 py-3">
                <Icon className="size-4 text-meta" strokeWidth={1.6} aria-hidden />
                <span className="flex-1 text-sm">{p.name}</span>
                <span className="tabular text-sm text-muted-foreground">{p.distanceKm} km · {p.walkMins} min walk</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-meta">Nearby places are illustrative demo data.</p>
      </div>
    </div>
  );
}
