import type { Metadata } from "next";
import { Suspense } from "react";
import { repo } from "@/lib/data";
import { filtersToSearchParams, searchParamsToFilters } from "@/lib/search/params";
import { SearchView } from "@/components/features/search/search-view";

export const metadata: Metadata = {
  title: "Search homes",
  description: "Homes to rent and buy in Lahore, on a map, with filters you can save.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SearchPage({ searchParams }: Props) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) if (typeof v === "string") params.set(k, v);
  const filters = searchParamsToFilters(params);

  const [firstPage, neighbourhoods] = await Promise.all([
    repo.listings.search(filters, 1, 12),
    repo.neighbourhoods.list(),
  ]);

  return (
    <Suspense>
      <SearchView
        initialPage={firstPage}
        initialQuery={filtersToSearchParams(filters).toString()}
        neighbourhoods={neighbourhoods.map((n) => ({ id: n.id, name: n.name }))}
      />
    </Suspense>
  );
}
