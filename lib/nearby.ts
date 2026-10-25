import type { GeoPoint } from "@/lib/data/types";
import { createRandom } from "@/lib/data/mock/seed/random";

export type PlaceKind = "school" | "hospital" | "mosque" | "park" | "market";

export interface NearbyPlace {
  kind: PlaceKind;
  name: string;
  location: GeoPoint;
  distanceKm: number;
  walkMins: number;
}

const NAMES: Record<PlaceKind, string[]> = {
  school: ["Beaconhouse School", "The City School", "Lahore Grammar School", "Aitchison Junior"],
  hospital: ["Family Care Hospital", "National Hospital", "Medicare Clinic", "City Hospital"],
  mosque: ["Jamia Masjid", "Masjid-e-Noor", "Masjid Al-Falah", "Block Mosque"],
  park: ["Community Park", "Jogging Track", "Family Park", "Green Belt"],
  market: ["Commercial Market", "Main Bazaar", "Al-Fatah", "Mini Market"],
};

/** Great-circle distance in kilometres. */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/**
 * Illustrative nearby places, generated deterministically around a listing so each listing always
 * shows the same ones. Replace with a places API (e.g. OSM Overpass) when real data is wanted.
 */
export function nearbyPlaces(listingId: string, at: GeoPoint): NearbyPlace[] {
  const seed = [...listingId].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const r = createRandom(seed);
  return (Object.keys(NAMES) as PlaceKind[]).map((kind) => {
    const location = { lat: at.lat + r.float(-0.008, 0.008), lng: at.lng + r.float(-0.009, 0.009) };
    const km = distanceKm(at, location);
    return { kind, name: r.pick(NAMES[kind]), location, distanceKm: Math.round(km * 10) / 10, walkMins: Math.max(2, Math.round((km / 4.8) * 60)) };
  }).sort((a, b) => a.distanceKm - b.distanceKm);
}
