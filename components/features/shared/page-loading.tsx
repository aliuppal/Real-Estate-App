import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton } from "@/components/features/search/result-list";

/** Shown while a data-heavy public page streams in: heading plus a card grid, matching the real layouts. */
export function PageLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-4 h-12 w-2/3 max-w-xl" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );
}
