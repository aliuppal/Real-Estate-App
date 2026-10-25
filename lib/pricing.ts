import type { Listing, Neighbourhood, PropertyType, Purpose } from "@/lib/data/types";
import { pricePerSqft } from "@/lib/search/filter";

/** Relative price per sq ft by type, used when there aren't enough comparables nearby. */
export const TYPE_FACTOR: Record<PropertyType, number> = {
  apartment: 0.95, house: 1, villa: 1.25, plot: 0.45, commercial: 1.35,
};

const MIN_COMPARABLES = 3;
const SPREAD = 0.08;

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

export const roundPrice = (price: number, purpose: Purpose) =>
  purpose === "rent" ? Math.round(price / 5_000) * 5_000 : Math.round(price / (price > 1e7 ? 500_000 : 100_000)) * (price > 1e7 ? 500_000 : 100_000);

export interface PriceSuggestion {
  low: number;
  mid: number;
  high: number;
  perSqft: number;
  basis: { kind: "comparables"; count: number } | { kind: "neighbourhood" };
}

/**
 * Suggested price range: median price per sq ft of comparable listings (same type and purpose
 * in the same neighbourhood) times the area, ±8%. Falls back to the neighbourhood reference rate.
 */
export function suggestPrice(
  input: { type: PropertyType; purpose: Purpose; areaSqft: number; neighbourhoodId: string },
  comparables: Listing[],
  neighbourhood: Neighbourhood,
): PriceSuggestion {
  const nearby = comparables.filter(
    (l) => l.neighbourhoodId === input.neighbourhoodId && l.type === input.type && l.purpose === input.purpose && l.areaSqft > 0,
  );
  const usesComps = nearby.length >= MIN_COMPARABLES;
  const reference = input.purpose === "sale" ? neighbourhood.avgSalePerSqft : neighbourhood.avgRentPerSqft;
  const perSqft = usesComps ? median(nearby.map(pricePerSqft)) : reference * TYPE_FACTOR[input.type];
  const mid = perSqft * input.areaSqft;

  return {
    low: roundPrice(mid * (1 - SPREAD), input.purpose),
    mid: roundPrice(mid, input.purpose),
    high: roundPrice(mid * (1 + SPREAD), input.purpose),
    perSqft: Math.round(perSqft),
    basis: usesComps ? { kind: "comparables", count: nearby.length } : { kind: "neighbourhood" },
  };
}

/** How a listing's price per sq ft compares with its neighbourhood's reference rate, as a ratio (1 = equal). */
export function vsNeighbourhood(listing: Pick<Listing, "price" | "areaSqft" | "purpose" | "type">, n: Neighbourhood) {
  const reference = (listing.purpose === "sale" ? n.avgSalePerSqft : n.avgRentPerSqft) * TYPE_FACTOR[listing.type];
  const own = pricePerSqft(listing);
  return { own: Math.round(own), reference: Math.round(reference), ratio: reference ? own / reference : 1 };
}
