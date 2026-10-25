"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { deleteSavedSearch, updateSavedSearch } from "@/app/actions/engagement";
import type { SavedSearch } from "@/lib/data/types";
import { filterChips } from "@/lib/search/describe";
import { searchHref } from "@/lib/search/params";
import { formatRelativeDate } from "@/lib/format";

export function SavedSearchList({ searches, nbNames, matchCounts }: { searches: SavedSearch[]; nbNames: Record<string, string>; matchCounts: Record<string, number> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done: string) => startTransition(async () => {
    const res = await fn();
    if (!res.ok) return void toast.error(res.error);
    toast.success(done);
    router.refresh();
  });

  if (!searches.length) {
    return (
      <div className="rounded-media border border-dashed border-hairline py-16 text-center">
        <p className="text-muted-foreground">No saved searches. Use “Save search” on the search page to get alerts.</p>
        <Link href="/search" className="mt-4 inline-block underline underline-offset-4">Start searching</Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-media border border-border bg-card">
      {searches.map((s) => (
        <li key={s.id} className="flex flex-wrap items-center gap-4 p-5">
          <div className="min-w-0 flex-1">
            <Link href={searchHref(s.filters)} className="text-lg underline-offset-4 hover:underline">{s.name}</Link>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {filterChips(s.filters, nbNames).map((c) => <span key={c.key} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">{c.label}</span>)}
            </div>
            <p className="mt-2 text-xs text-muted-foreground"><span className="tabular">{matchCounts[s.id] ?? 0}</span> homes match now · saved {formatRelativeDate(s.createdAt)}</p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            Alerts
            <Switch checked={s.alertsEnabled} disabled={pending} onCheckedChange={(v) => run(() => updateSavedSearch(s.id, { alertsEnabled: v }), v ? "Alerts on" : "Alerts off")} />
          </label>
          <button type="button" disabled={pending} onClick={() => run(() => deleteSavedSearch(s.id), "Saved search deleted")} className="text-sm text-muted-foreground underline-offset-4 hover:underline">Delete</button>
        </li>
      ))}
    </ul>
  );
}
