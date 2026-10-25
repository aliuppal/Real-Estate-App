"use client";

import dynamic from "next/dynamic";

/** Client boundary so server-rendered profile pages can lazy-load the Leaflet map. */
export const LazyAreasMap = dynamic(() => import("./areas-map"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-muted" aria-label="Loading map" />,
});
