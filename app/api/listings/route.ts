import { NextResponse, type NextRequest } from "next/server";
import { repo } from "@/lib/data";
import { searchParamsToFilters } from "@/lib/search/params";

/**
 * Paged search results for the search page's infinite list.
 * With `ids=a,b,c` it returns those listings instead (public ones only), in that order.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const ids = params.get("ids");
  if (ids) {
    const items = (await repo.listings.findManyByIds(ids.split(",").slice(0, 24)))
      .filter((l) => l.status === "active" || l.status === "under_offer");
    return NextResponse.json({ items, total: items.length, page: 1, pageSize: items.length });
  }
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.min(48, Math.max(1, Number(params.get("pageSize")) || 12));
  return NextResponse.json(await repo.listings.search(searchParamsToFilters(params), page, pageSize));
}
