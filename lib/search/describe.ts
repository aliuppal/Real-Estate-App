import type { SearchFilters, SortKey } from "@/lib/data/types";
import { amenityLabels, typeLabels } from "@/lib/labels";
import { formatArea, formatPrice } from "@/lib/format";

export const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  most_viewed: "Most viewed",
  price_per_area: "Price per sq ft",
};

/** "1.2Cr", "85L", "45k": short enough for a map pin. */
export function shortPrice(n: number): string {
  if (n >= 1e7) return `${+(n / 1e7).toFixed(n >= 1e8 ? 0 : 1)}Cr`;
  if (n >= 1e5) return `${+(n / 1e5).toFixed(n >= 1e6 ? 0 : 1)}L`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(n);
}

export interface FilterChip {
  key: string;
  label: string;
  remove: (f: SearchFilters) => SearchFilters;
}

const without = <K extends keyof SearchFilters>(...keys: K[]) => (f: SearchFilters): SearchFilters => {
  const next = { ...f };
  for (const k of keys) delete next[k];
  return next;
};

/** Removable chips for every active filter, in a stable order. */
export function filterChips(f: SearchFilters, nbNames: Record<string, string>): FilterChip[] {
  const chips: FilterChip[] = [];
  const money = (n: number) => formatPrice(n, { compact: true });
  if (f.purpose) chips.push({ key: "purpose", label: f.purpose === "rent" ? "To rent" : "To buy", remove: without("purpose") });
  for (const t of f.types ?? []) chips.push({ key: `type-${t}`, label: typeLabels[t], remove: (x) => ({ ...x, types: x.types?.filter((y) => y !== t) }) });
  for (const id of f.neighbourhoodIds ?? []) {
    chips.push({ key: `nb-${id}`, label: nbNames[id] ?? id, remove: (x) => ({ ...x, neighbourhoodIds: x.neighbourhoodIds?.filter((y) => y !== id) }) });
  }
  if (f.minPrice || f.maxPrice) {
    const label = f.minPrice && f.maxPrice ? `${money(f.minPrice)} – ${money(f.maxPrice)}` : f.maxPrice ? `Under ${money(f.maxPrice)}` : `Over ${money(f.minPrice!)}`;
    chips.push({ key: "price", label, remove: without("minPrice", "maxPrice") });
  }
  if (f.minBeds) chips.push({ key: "beds", label: `${f.minBeds}+ beds`, remove: without("minBeds") });
  if (f.minBaths) chips.push({ key: "baths", label: `${f.minBaths}+ baths`, remove: without("minBaths") });
  if (f.minAreaSqft || f.maxAreaSqft) {
    const label = [f.minAreaSqft && `${formatArea(f.minAreaSqft, "sqft")}+`, f.maxAreaSqft && `up to ${formatArea(f.maxAreaSqft, "sqft")}`].filter(Boolean).join(", ");
    chips.push({ key: "area", label, remove: without("minAreaSqft", "maxAreaSqft") });
  }
  if (f.furnished) chips.push({ key: "furnished", label: "Furnished", remove: without("furnished") });
  if (f.petsAllowed) chips.push({ key: "pets", label: "Pets allowed", remove: without("petsAllowed") });
  if (f.parking) chips.push({ key: "parking", label: "Parking", remove: without("parking") });
  for (const a of f.amenities ?? []) chips.push({ key: `am-${a}`, label: amenityLabels[a], remove: (x) => ({ ...x, amenities: x.amenities?.filter((y) => y !== a) }) });
  if (f.listedBy) chips.push({ key: "by", label: f.listedBy === "owner" ? "By owner" : "By agent", remove: without("listedBy") });
  if (f.verifiedOnly) chips.push({ key: "verified", label: "Verified only", remove: without("verifiedOnly") });
  if (f.listedWithinDays) chips.push({ key: "days", label: f.listedWithinDays === 1 ? "Last 24 hours" : `Last ${f.listedWithinDays} days`, remove: without("listedWithinDays") });
  if (f.q) chips.push({ key: "q", label: `“${f.q}”`, remove: without("q") });
  if (f.polygon) chips.push({ key: "polygon", label: "Drawn area", remove: without("polygon") });
  return chips;
}

/** A sensible default name for a saved search, e.g. "Houses to buy in DHA Phase 6 under Rs 10 Crore". */
export function describeFilters(f: SearchFilters, nbNames: Record<string, string>): string {
  const what = f.types?.length === 1 ? `${typeLabels[f.types[0]]}s` : "Homes";
  const purpose = f.purpose === "rent" ? " to rent" : f.purpose === "sale" ? " to buy" : "";
  const where = f.neighbourhoodIds?.length ? ` in ${f.neighbourhoodIds.map((id) => nbNames[id] ?? id).join(" & ")}` : f.polygon ? " in my drawn area" : "";
  const price = f.maxPrice ? ` under ${formatPrice(f.maxPrice, { compact: true })}` : "";
  const beds = f.minBeds ? `, ${f.minBeds}+ beds` : "";
  return `${what}${purpose}${where}${price}${beds}`.slice(0, 60);
}

/** Number shown on the Filters button: everything except purpose, free text and sort, which live in the toolbar. */
export const activeFilterCount = (f: SearchFilters) =>
  filterChips(f, {}).filter((c) => c.key !== "purpose" && c.key !== "q").length;
