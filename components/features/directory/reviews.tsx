import { Star } from "lucide-react";
import type { Review } from "@/lib/data/types";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={i <= rating ? "size-3.5 fill-current" : "size-3.5 text-hairline"} aria-hidden />)}
    </span>
  );
}

export function Reviews({ reviews, rating }: { reviews: Review[]; rating: number }) {
  if (!reviews.length) return <p className="text-muted-foreground">No reviews yet.</p>;
  return (
    <div className="grid gap-10 md:grid-cols-[200px_1fr]">
      <div>
        <p className="tabular font-display text-6xl tracking-[-0.03em]">{rating.toFixed(1)}</p>
        <Stars rating={Math.round(rating)} />
        <p className="mt-1 text-sm text-muted-foreground">{reviews.length} review{reviews.length === 1 ? "" : "s"}</p>
      </div>
      <ul className="divide-y divide-border">
        {reviews.map((r) => (
          <li key={r.id} className="py-5 first:pt-0">
            <div className="flex items-center justify-between gap-4">
              <Stars rating={r.rating} />
              <time dateTime={r.createdAt} className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("en-PK", { month: "short", year: "numeric" })}</time>
            </div>
            <p className="mt-2 leading-relaxed">“{r.comment}”</p>
            <p className="mt-2 text-sm text-muted-foreground">{r.authorName}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
