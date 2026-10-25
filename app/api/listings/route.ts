import { NextResponse, type NextRequest } from "next/server";
import { repo } from "@/lib/data";
import { searchParamsToFilters } from "@/lib/search/params";

/** Paged search results for the search page's infinite list. */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.min(48, Math.max(1, Number(params.get("pageSize")) || 12));
  const result = await repo.listings.search(searchParamsToFilters(params), page, pageSize);
  return NextResponse.json(result);
}
