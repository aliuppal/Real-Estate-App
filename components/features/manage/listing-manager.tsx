"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Eye, Heart, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateListing } from "@/app/actions/listings";
import { moderateListing, setListingVerified } from "@/app/actions/admin";
import type { Listing, ListingStatus } from "@/lib/data/types";
import { formatPrice } from "@/lib/format";
import { StatusPill } from "@/components/dashboard/stat-card";
import { HandoverDialog, type HandoverMatch } from "./handover-dialog";

export type ManagedListing = Listing & { neighbourhoodName: string; agentName?: string | null };

interface ListingManagerProps {
  listings: ManagedListing[];
  perspective: "owner" | "agent" | "agency" | "admin";
  handover?: Record<string, HandoverMatch[]>;
  emptyText: string;
}

const statusOptions = (l: Listing): ListingStatus[] =>
  ["draft", "active", "under_offer", l.purpose === "sale" ? "sold" : "rented", "archived"];

function Row({ l, perspective, matches }: { l: ManagedListing; perspective: ListingManagerProps["perspective"]; matches?: HandoverMatch[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingPrice, setEditingPrice] = useState(false);
  const [price, setPrice] = useState(String(l.price));

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done: string) => startTransition(async () => {
    const res = await fn();
    if (!res.ok) return void toast.error(res.error);
    toast.success(done);
    setEditingPrice(false);
    router.refresh();
  });

  return (
    <li className="grid gap-4 p-4 sm:grid-cols-[96px_1fr_auto] sm:items-center">
      <div className="relative aspect-[4/3] w-24 overflow-hidden rounded-lg bg-muted">
        {l.images[0] && <Image src={l.images[0]} alt="" fill sizes="96px" className="object-cover" />}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/listings/${l.id}`} className="truncate underline-offset-4 hover:underline">{l.title}</Link>
          <StatusPill status={l.status} />
          {l.verified && <BadgeCheck className="size-4 text-brand dark:text-[#4cc3a4]" aria-label="Verified" />}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {l.neighbourhoodName} · {formatPrice(l.price, { compact: true, purpose: l.purpose })}
          {l.agentName !== undefined && ` · ${l.agentName ?? (l.listedBy === "owner" ? "Owner listing" : "Unassigned")}`}
        </p>
        <p className="mt-1 flex gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Eye className="size-3.5" aria-hidden />{l.views.toLocaleString("en-PK")}</span>
          <span className="inline-flex items-center gap-1"><Heart className="size-3.5" aria-hidden />{l.saves}</span>
          <span className="inline-flex items-center gap-1"><MessageSquare className="size-3.5" aria-hidden />{l.enquiries}</span>
        </p>
        {editingPrice && (
          <form className="mt-3 flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); run(() => updateListing(l.id, { price: Math.round(Number(price)) }), "Price updated"); }}>
            <label className="sr-only" htmlFor={`price-${l.id}`}>New price</label>
            <input id={`price-${l.id}`} type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} className="tabular h-9 w-40 rounded-lg border border-input bg-background px-3 text-sm" />
            <Button size="sm" type="submit" disabled={pending}>Save</Button>
            <Button size="sm" type="button" variant="ghost" onClick={() => setEditingPrice(false)}>Cancel</Button>
          </form>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {perspective === "admin" ? (
          <>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setListingVerified(l.id, !l.verified), l.verified ? "Badge removed" : "Marked verified")}>
              {l.verified ? "Unverify" : "Verify"}
            </Button>
            <Button size="sm" variant={l.status === "archived" ? "outline" : "destructive"} disabled={pending}
              onClick={() => run(() => moderateListing(l.id, l.status === "archived" ? "active" : "archived"), l.status === "archived" ? "Listing restored" : "Listing taken down")}>
              {l.status === "archived" ? "Restore" : "Take down"}
            </Button>
          </>
        ) : (
          <>
            <label className="sr-only" htmlFor={`status-${l.id}`}>Status</label>
            <select id={`status-${l.id}`} value={l.status} disabled={pending}
              onChange={(e) => run(() => updateListing(l.id, { status: e.target.value as ListingStatus }), "Status updated")}
              className="h-9 rounded-lg border border-input bg-background px-2 text-sm">
              {statusOptions(l).map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
            <Button size="sm" variant="outline" onClick={() => setEditingPrice(true)}>Change price</Button>
            {perspective === "owner" && !l.agentId && matches?.length ? <HandoverDialog listingId={l.id} title={l.title} matches={matches} /> : null}
          </>
        )}
      </div>
    </li>
  );
}

export function ListingManager({ listings, perspective, handover, emptyText }: ListingManagerProps) {
  if (!listings.length) return <p className="rounded-media border border-dashed border-hairline py-16 text-center text-muted-foreground">{emptyText}</p>;
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-media border border-border bg-card">
      {listings.map((l) => <Row key={l.id} l={l} perspective={perspective} matches={handover?.[l.id]} />)}
    </ul>
  );
}
