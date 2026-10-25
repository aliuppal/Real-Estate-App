"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { decideOffer } from "@/app/actions/crm";
import type { Offer, Purpose } from "@/lib/data/types";
import { formatPrice, formatRelativeDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export type OfferRow = { offer: Offer; listingTitle: string; listingId: string; asking: number; purpose: Purpose; personName: string };

const STEPS = ["Submitted", "Reviewing", "Decision"] as const;

function Tracker({ status }: { status: Offer["status"] }) {
  const reached = status === "submitted" ? 0 : status === "reviewing" ? 1 : 2;
  const final = status === "accepted" ? "Accepted" : status === "rejected" ? "Declined" : status === "withdrawn" ? "Withdrawn" : "Decision";
  return (
    <ol className="flex items-center gap-2" aria-label={`Status: ${status}`}>
      {STEPS.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2">
          <span className={cn("size-2.5 shrink-0 rounded-full", i <= reached ? (status === "rejected" && i === 2 ? "bg-destructive" : "bg-[var(--chart-1)]") : "bg-hairline")} />
          <span className={cn("text-xs", i <= reached ? "text-foreground" : "text-muted-foreground")}>{i === 2 ? final : s}</span>
          {i < 2 && (
            <span className="relative h-px flex-1 overflow-hidden bg-hairline">
              <span className="absolute inset-0 origin-left bg-[var(--chart-1)] transition-transform duration-500" style={{ transform: `scaleX(${i < reached ? 1 : 0})` }} />
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

function Actions({ o, perspective }: { o: Offer; perspective: "host" | "seeker" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const act = (status: "reviewing" | "accepted" | "rejected" | "withdrawn", done: string) => startTransition(async () => {
    const res = await decideOffer(o.id, status);
    if (!res.ok) return void toast.error(res.error);
    toast.success(done);
    router.refresh();
  });
  const open = o.status === "submitted" || o.status === "reviewing";
  if (!open) return null;
  if (perspective === "seeker") return <Button size="sm" variant="ghost" disabled={pending} onClick={() => act("withdrawn", "Withdrawn")}>Withdraw</Button>;
  return (
    <div className="flex flex-wrap gap-2">
      {o.status === "submitted" && <Button size="sm" variant="outline" disabled={pending} onClick={() => act("reviewing", "Marked as reviewing")}>Review</Button>}
      <Button size="sm" disabled={pending} onClick={() => act("accepted", "Accepted. The listing is now under offer.")}>Accept</Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => act("rejected", "Declined")}>Decline</Button>
    </div>
  );
}

export function OfferList({ rows, perspective, emptyText }: { rows: OfferRow[]; perspective: "host" | "seeker"; emptyText: string }) {
  if (!rows.length) return <p className="rounded-media border border-dashed border-hairline py-16 text-center text-muted-foreground">{emptyText}</p>;
  return (
    <ul className="space-y-3">
      {rows.map(({ offer: o, listingTitle, listingId, asking, purpose, personName }) => {
        const diff = Math.round(((o.amount - asking) / asking) * 100);
        return (
          <li key={o.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="mono-label text-[0.6875rem] text-meta">{o.kind === "offer" ? "Offer" : "Rental application"} · {formatRelativeDate(o.createdAt)}</p>
                <Link href={`/listings/${listingId}`} className="mt-1 block truncate text-lg underline-offset-4 hover:underline">{listingTitle}</Link>
                <p className="text-sm text-muted-foreground">{perspective === "host" ? `From ${personName}` : `To ${personName}`}</p>
              </div>
              <div className="text-right">
                <p className="tabular text-2xl">{formatPrice(o.amount, { compact: true, purpose })}</p>
                <p className="text-xs text-muted-foreground">{diff === 0 ? "At asking" : `${Math.abs(diff)}% ${diff < 0 ? "below" : "above"} asking`}</p>
              </div>
            </div>
            {o.message && <p className="mt-3 rounded-lg bg-muted px-4 py-3 text-sm">“{o.message}”</p>}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-64 flex-1"><Tracker status={o.status} /></div>
              <Actions o={o} perspective={perspective} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
