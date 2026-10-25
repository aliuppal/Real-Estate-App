import { NextResponse, type NextRequest } from "next/server";
import { repo } from "@/lib/data";
import { searchParamsToFilters } from "@/lib/search/params";

export type Pin = {
  id: string;
  lat: number;
  lng: number;
  price: number;
  purpose: "rent" | "sale";
  title: string;
  image: string;
  beds: number;
  neighbourhoodId: string;
};

/**
 * Every match as a lightweight map pin. The polygon filter is deliberately ignored so pins outside
 * a drawn area stay visible (dimmed) for context; the list applies it.
 */
export async function GET(req: NextRequest) {
  const filters = searchParamsToFilters(req.nextUrl.searchParams);
  const all = await repo.listings.searchAll({ ...filters, polygon: undefined });
  const pins: Pin[] = all.map((l) => ({
    id: l.id, lat: l.location.lat, lng: l.location.lng, price: l.price, purpose: l.purpose,
    title: l.title, image: l.images[0] ?? "", beds: l.beds, neighbourhoodId: l.neighbourhoodId,
  }));
  return NextResponse.json(pins);
}
