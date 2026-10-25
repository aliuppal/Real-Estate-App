"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Columns3, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createCollection, deleteCollection, renameCollection, toggleSaved } from "@/app/actions/engagement";
import type { Collection, Listing } from "@/lib/data/types";
import { PropertyCard } from "@/components/features/listings/property-card";
import { cn } from "@/lib/utils";

interface CollectionsBoardProps {
  collections: Collection[];
  listings: Listing[];
  nbNames: Record<string, string>;
}

/** Saved homes by collection; pick up to four to compare. */
export function CollectionsBoard({ collections, listings, nbNames }: CollectionsBoardProps) {
  const router = useRouter();
  const [active, setActive] = useState(collections[0]?.id ?? "");
  const [compare, setCompare] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const current = collections.find((c) => c.id === active);
  const items = (current?.listingIds ?? []).map((id) => listings.find((l) => l.id === id)).filter((l): l is Listing => !!l);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done?: string) => startTransition(async () => {
    const res = await fn();
    if (!res.ok) return void toast.error(res.error);
    if (done) toast.success(done);
    router.refresh();
  });

  const add = () => {
    const name = window.prompt("Name your new collection", "Weekend viewings");
    if (name?.trim()) run(() => createCollection(name), "Collection created");
  };
  const rename = () => {
    const name = current && window.prompt("Rename collection", current.name);
    if (current && name?.trim()) run(() => renameCollection(current.id, name), "Renamed");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Collections" className="flex flex-wrap gap-1 rounded-full border border-hairline p-1">
          {collections.map((c) => (
            <button key={c.id} type="button" role="tab" aria-selected={c.id === active} onClick={() => setActive(c.id)}
              className={cn("relative rounded-full px-4 py-1.5 text-sm", c.id === active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {c.id === active && <motion.span layoutId="col-tab" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
              <span className="relative">{c.name} <span className="tabular opacity-70">{c.listingIds.length}</span></span>
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={add} disabled={pending}><Plus className="size-4" aria-hidden /> New collection</Button>
        {current && <Button variant="ghost" size="sm" onClick={rename}>Rename</Button>}
        {current && collections.length > 1 && (
          <Button variant="ghost" size="sm" onClick={() => window.confirm(`Delete “${current.name}”? Saved homes in other collections are kept.`) && run(() => deleteCollection(current.id), "Collection deleted")}>
            <Trash2 className="size-4" aria-hidden /> Delete
          </Button>
        )}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground" aria-live="polite">{compare.length}/4 selected</span>
          <Link href={compare.length >= 2 ? `/dashboard/seeker/compare?ids=${compare.join(",")}` : "#"} aria-disabled={compare.length < 2}
            className={cn("inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm text-primary-foreground", compare.length < 2 && "pointer-events-none opacity-40")}>
            <Columns3 className="size-4" aria-hidden /> Compare
          </Link>
        </div>
      </div>

      {items.length ? (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((l) => (
            <li key={l.id} className="space-y-2">
              <PropertyCard listing={l} neighbourhoodName={nbNames[l.neighbourhoodId] ?? ""} className="h-full" />
              <div className="flex items-center justify-between px-1 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={compare.includes(l.id)} disabled={!compare.includes(l.id) && compare.length >= 4}
                    onChange={() => setCompare((c) => (c.includes(l.id) ? c.filter((x) => x !== l.id) : [...c, l.id]))} className="size-4 accent-[var(--chart-1)]" />
                  Compare
                </label>
                <button type="button" onClick={() => run(() => toggleSaved(l.id, current!.id), "Removed from collection")} className="text-muted-foreground underline-offset-4 hover:underline">
                  Remove from {current!.name}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-media border border-dashed border-hairline py-16 text-center">
          <p className="text-muted-foreground">Nothing saved here yet. Tap the heart on any home.</p>
          <Link href="/search" className="mt-4 inline-block underline underline-offset-4">Browse homes</Link>
        </div>
      )}
    </div>
  );
}
