"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setViewingStatus } from "@/app/actions/crm";
import type { Viewing } from "@/lib/data/types";
import { formatInLahore } from "@/lib/availability";
import { StatusPill } from "@/components/dashboard/stat-card";

export type ViewingRow = { viewing: Viewing; listingTitle: string; listingId: string; personName: string };

function Actions({ v, perspective }: { v: Viewing; perspective: "host" | "seeker" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const act = (status: "confirmed" | "completed" | "cancelled", done: string) => startTransition(async () => {
    const res = await setViewingStatus(v.id, status);
    if (!res.ok) return void toast.error(res.error);
    toast.success(done);
    router.refresh();
  });
  const past = new Date(v.start) < new Date();
  if (v.status === "cancelled" || v.status === "completed") return null;
  if (perspective === "seeker") return <Button size="sm" variant="ghost" disabled={pending} onClick={() => act("cancelled", "Viewing cancelled")}>Cancel</Button>;
  return (
    <div className="flex gap-2">
      {v.status === "requested" && <Button size="sm" disabled={pending} onClick={() => act("confirmed", "Viewing confirmed")}>Confirm</Button>}
      {v.status === "confirmed" && past && <Button size="sm" variant="outline" disabled={pending} onClick={() => act("completed", "Marked as done")}>Mark done</Button>}
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => act("cancelled", v.status === "requested" ? "Request declined" : "Viewing cancelled")}>
        {v.status === "requested" ? "Decline" : "Cancel"}
      </Button>
    </div>
  );
}

/** Viewings grouped by day (Lahore time), upcoming first, with actions for whoever is looking. */
export function ViewingList({ rows, perspective }: { rows: ViewingRow[]; perspective: "host" | "seeker" }) {
  const now = Date.now();
  const upcoming = rows.filter((r) => new Date(r.viewing.end).getTime() >= now && r.viewing.status !== "cancelled");
  const past = rows.filter((r) => !upcoming.includes(r)).reverse();

  const group = (list: ViewingRow[]) => {
    const days = new Map<string, ViewingRow[]>();
    for (const r of list) {
      const day = formatInLahore(r.viewing.start, { weekday: "long", day: "numeric", month: "long" });
      days.set(day, [...(days.get(day) ?? []), r]);
    }
    return [...days.entries()];
  };

  const section = (title: string, list: ViewingRow[]) => (
    <section aria-label={title} className="space-y-6">
      <h2 className="mono-label text-meta">{title}</h2>
      {list.length ? group(list).map(([day, items]) => (
        <div key={day}>
          <h3 className="mb-2 text-lg">{day}</h3>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {items.map(({ viewing: v, listingTitle, listingId, personName }) => (
              <li key={v.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
                <span className="tabular w-20 shrink-0 text-lg">{formatInLahore(v.start, { hour: "numeric", minute: "2-digit" })}</span>
                <span className="min-w-0 flex-1">
                  <Link href={`/listings/${listingId}`} className="block truncate underline-offset-4 hover:underline">{listingTitle}</Link>
                  <span className="block truncate text-sm text-muted-foreground">{perspective === "host" ? "With" : "Shown by"} {personName}{v.note ? ` · “${v.note}”` : ""}</span>
                </span>
                <StatusPill status={v.status} />
                <Actions v={v} perspective={perspective} />
              </li>
            ))}
          </ul>
        </div>
      )) : <p className="text-sm text-muted-foreground">Nothing here.</p>}
    </section>
  );

  return <div className="space-y-12">{section("Upcoming", upcoming)}{past.length > 0 && section("Past and cancelled", past)}</div>;
}
