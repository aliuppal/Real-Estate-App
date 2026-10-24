import { AMENITIES, PROPERTY_TYPES, type Amenity, type PropertyType, type SearchFilters, type SortKey } from "@/lib/data/types";

/** SearchFilters ⇄ URL query string, so searches are shareable. Polygons are encoded as "lat,lng;lat,lng…". */

const SORTS: SortKey[] = ["newest", "price_asc", "price_desc", "most_viewed", "price_per_area"];
const num = (v: string | null) => (v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined);
const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : undefined);
const isType = (t: string): t is PropertyType => (PROPERTY_TYPES as readonly string[]).includes(t);
const isAmenity = (a: string): a is Amenity => (AMENITIES as readonly string[]).includes(a);

export function filtersToSearchParams(f: SearchFilters): URLSearchParams {
  const p = new URLSearchParams();
  const set = (k: string, v: unknown) => {
    if (v === undefined || v === null || v === "" || v === false) return;
    if (Array.isArray(v)) {
      if (v.length) p.set(k, v.join(","));
    } else p.set(k, String(v));
  };
  set("purpose", f.purpose);
  set("q", f.q);
  set("types", f.types);
  set("neighbourhoodIds", f.neighbourhoodIds);
  set("minPrice", f.minPrice);
  set("maxPrice", f.maxPrice);
  set("minBeds", f.minBeds);
  set("minBaths", f.minBaths);
  set("minAreaSqft", f.minAreaSqft);
  set("maxAreaSqft", f.maxAreaSqft);
  set("furnished", f.furnished);
  set("petsAllowed", f.petsAllowed);
  set("parking", f.parking);
  set("amenities", f.amenities);
  set("listedBy", f.listedBy);
  set("verifiedOnly", f.verifiedOnly);
  set("listedWithinDays", f.listedWithinDays);
  if (f.polygon?.length) p.set("polygon", f.polygon.map(([a, b]) => `${a.toFixed(5)},${b.toFixed(5)}`).join(";"));
  if (f.sort && f.sort !== "newest") p.set("sort", f.sort);
  return p;
}

/** Lenient parse: unknown values are dropped rather than throwing. */
export function searchParamsToFilters(p: URLSearchParams): SearchFilters {
  const purpose = p.get("purpose");
  const listedBy = p.get("listedBy");
  const sort = p.get("sort") as SortKey | null;
  const polygon = p.get("polygon")
    ?.split(";")
    .map((pair) => pair.split(",").map(Number) as [number, number])
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));

  return {
    purpose: purpose === "rent" || purpose === "sale" ? purpose : undefined,
    q: p.get("q") ?? undefined,
    types: list(p.get("types"))?.filter(isType),
    neighbourhoodIds: list(p.get("neighbourhoodIds")),
    minPrice: num(p.get("minPrice")),
    maxPrice: num(p.get("maxPrice")),
    minBeds: num(p.get("minBeds")),
    minBaths: num(p.get("minBaths")),
    minAreaSqft: num(p.get("minAreaSqft")),
    maxAreaSqft: num(p.get("maxAreaSqft")),
    furnished: p.get("furnished") === "true" || undefined,
    petsAllowed: p.get("petsAllowed") === "true" || undefined,
    parking: p.get("parking") === "true" || undefined,
    amenities: list(p.get("amenities"))?.filter(isAmenity),
    listedBy: listedBy === "owner" || listedBy === "agent" ? listedBy : undefined,
    verifiedOnly: p.get("verifiedOnly") === "true" || undefined,
    listedWithinDays: num(p.get("listedWithinDays")),
    polygon: polygon && polygon.length >= 3 ? polygon : undefined,
    sort: sort && SORTS.includes(sort) ? sort : undefined,
  };
}

export const searchHref = (f: SearchFilters) => {
  const qs = filtersToSearchParams(f).toString();
  return qs ? `/search?${qs}` : "/search";
};
