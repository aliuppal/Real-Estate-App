"use client";

import dynamic from "next/dynamic";
import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { generateDescription, suggestListingPrice } from "@/app/actions/listings";
import { AMENITIES, PROPERTY_TYPES, type GeoPoint } from "@/lib/data/types";
import { amenityLabels, typeLabels } from "@/lib/labels";
import { formatPrice, sqftTo, toSqft } from "@/lib/format";
import { locale, type AreaUnit } from "@/config/locale";
import type { PriceSuggestion } from "@/lib/pricing";
import type { ListingInput } from "@/lib/validation/listing";
import { cn } from "@/lib/utils";

const PinMap = dynamic(() => import("./pin-map"), { ssr: false, loading: () => <div className="size-full animate-pulse bg-muted" /> });

export type Draft = Partial<ListingInput> & { purpose: ListingInput["purpose"]; type: ListingInput["type"]; images: string[]; amenities: ListingInput["amenities"] };
export type StepProps = { draft: Draft; set: (patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => void };

const chip = (on: boolean) => cn("rounded-full border px-4 py-2 text-sm transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "border-hairline hover:border-foreground/40");
const field = "h-11";
const isHome = (t: Draft["type"]) => t !== "plot" && t !== "commercial";
const num = (v: string) => (v === "" ? undefined : Number(v));

export function TypeStep({ draft, set, team }: StepProps & { team?: { id: string; name: string }[] }) {
  return (
    <div className="space-y-8">
      <fieldset><legend className="mb-3 text-lg">I want to</legend>
        <div className="flex gap-2">{(["sale", "rent"] as const).map((p) => <button key={p} type="button" aria-pressed={draft.purpose === p} onClick={() => set({ purpose: p })} className={chip(draft.purpose === p)}>{p === "sale" ? "Sell" : "Rent out"}</button>)}</div>
      </fieldset>
      <fieldset><legend className="mb-3 text-lg">Property type</legend>
        <div className="flex flex-wrap gap-2">{PROPERTY_TYPES.map((t) => <button key={t} type="button" aria-pressed={draft.type === t} onClick={() => set({ type: t, beds: isHome(t) ? draft.beds ?? 3 : 0 })} className={chip(draft.type === t)}>{typeLabels[t]}</button>)}</div>
      </fieldset>
      {team && (
        <label className="block max-w-sm text-sm">Agent handling this listing
          <select value={draft.agentId ?? ""} onChange={(e) => set({ agentId: e.target.value || null })} className="mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3">
            <option value="">Choose an agent</option>{team.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
      )}
    </div>
  );
}

export function LocationStep({ draft, set, areas }: StepProps & { areas: { id: string; name: string; center: GeoPoint }[] }) {
  const area = areas.find((a) => a.id === draft.neighbourhoodId);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">Neighbourhood
          <select value={draft.neighbourhoodId ?? ""} onChange={(e) => set({ neighbourhoodId: e.target.value, location: undefined })} className="mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3">
            <option value="">Choose…</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
        <label className="text-sm">Address<Input value={draft.address ?? ""} onChange={(e) => set({ address: e.target.value })} placeholder="House 12, Street 4, Sector C" className={cn(field, "mt-1.5")} /></label>
      </div>
      {area ? (
        <div>
          <p className="mb-2 text-sm text-muted-foreground">{draft.location ? "Drag the pin to fine-tune." : "Click the map to drop a pin on the exact spot."}</p>
          <div className="h-80 overflow-hidden rounded-media border border-border"><PinMap center={area.center} value={draft.location ?? null} onChange={(location) => set({ location })} /></div>
        </div>
      ) : <p className="text-sm text-muted-foreground">Choose a neighbourhood to place the pin.</p>}
    </div>
  );
}

export function DetailsStep({ draft, set, areaName }: StepProps & { areaName: string }) {
  const [unit, setUnit] = useState<AreaUnit>(isHome(draft.type) ? "sqft" : "marla");
  const [pending, startTransition] = useTransition();
  const home = isHome(draft.type);
  const generate = () => startTransition(async () => {
    const res = await generateDescription({
      type: draft.type, purpose: draft.purpose, areaSqft: draft.areaSqft ?? 0, plotSqft: draft.plotSqft ?? null, beds: draft.beds ?? 0, baths: draft.baths ?? 0,
      furnished: !!draft.furnished, amenities: draft.amenities, neighbourhoodName: areaName,
    });
    if (res.ok) set({ description: res.data }); else toast.error(res.error);
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <label className="text-sm">{draft.type === "plot" ? "Plot area" : "Covered area"}
          <Input type="number" min={0} value={draft.areaSqft ? +sqftTo(draft.areaSqft, unit).toFixed(1) : ""} onChange={(e) => set({ areaSqft: e.target.value ? toSqft(Number(e.target.value), unit) : undefined, ...(draft.type === "plot" && { plotSqft: e.target.value ? toSqft(Number(e.target.value), unit) : null }) })} className={cn(field, "mt-1.5")} />
        </label>
        <label className="text-sm">Unit
          <select value={unit} onChange={(e) => setUnit(e.target.value as AreaUnit)} className="mt-1.5 h-11 rounded-lg border border-input bg-background px-3">
            {(Object.keys(locale.areaUnits) as AreaUnit[]).map((u) => <option key={u} value={u}>{locale.areaUnits[u].label}</option>)}
          </select>
        </label>
      </div>
      {(draft.type === "house" || draft.type === "villa") && (
        <label className="block max-w-xs text-sm">Land size (marla)
          <Input type="number" min={1} value={draft.plotSqft ? +sqftTo(draft.plotSqft, "marla").toFixed(1) : ""} onChange={(e) => set({ plotSqft: e.target.value ? toSqft(Number(e.target.value), "marla") : null })} className={cn(field, "mt-1.5")} />
        </label>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {home && <label className="text-sm">Bedrooms<Input type="number" min={0} max={20} value={draft.beds ?? ""} onChange={(e) => set({ beds: num(e.target.value) })} className={cn(field, "mt-1.5")} /></label>}
        {draft.type !== "plot" && <label className="text-sm">{home ? "Bathrooms" : "Washrooms"}<Input type="number" min={0} max={20} value={draft.baths ?? ""} onChange={(e) => set({ baths: num(e.target.value) })} className={cn(field, "mt-1.5")} /></label>}
        {draft.type !== "plot" && <label className="text-sm">Parking<Input type="number" min={0} max={50} value={draft.parking ?? ""} onChange={(e) => set({ parking: num(e.target.value) })} className={cn(field, "mt-1.5")} /></label>}
        {draft.type !== "plot" && <label className="text-sm">Year built<Input type="number" min={1900} value={draft.yearBuilt ?? ""} onChange={(e) => set({ yearBuilt: num(e.target.value) ?? null })} className={cn(field, "mt-1.5")} /></label>}
      </div>
      {home && (
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-3 text-sm"><Switch checked={!!draft.furnished} onCheckedChange={(v) => set({ furnished: v })} /> Furnished</label>
          <label className="flex items-center gap-3 text-sm"><Switch checked={!!draft.petsAllowed} onCheckedChange={(v) => set({ petsAllowed: v })} /> Pets allowed</label>
        </div>
      )}
      <label className="block text-sm">Title<Input value={draft.title ?? ""} onChange={(e) => set({ title: e.target.value })} maxLength={100} placeholder="10 Marla corner house near the park" className={cn(field, "mt-1.5")} /></label>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between"><label htmlFor="desc" className="text-sm">Description</label>
          <Button type="button" variant="outline" size="sm" onClick={generate} disabled={pending || !draft.areaSqft}><Sparkles className="size-3.5" aria-hidden /> {pending ? "Writing…" : "Generate description"}</Button>
        </div>
        <Textarea id="desc" value={draft.description ?? ""} onChange={(e) => set({ description: e.target.value })} rows={6} maxLength={4000} />
      </div>
    </div>
  );
}

export function AmenitiesStep({ draft, set }: StepProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {AMENITIES.map((a) => {
        const on = draft.amenities.includes(a);
        return (
          <button key={a} type="button" aria-pressed={on} className={chip(on)}
            onClick={() => set((d) => ({ amenities: d.amenities.includes(a) ? d.amenities.filter((x) => x !== a) : [...d.amenities, a] }))}>
            {amenityLabels[a]}
          </button>
        );
      })}
    </div>
  );
}

export function PricingStep({ draft, set }: StepProps) {
  const [suggestion, setSuggestion] = useState<PriceSuggestion | null>(null);
  const [pending, startTransition] = useTransition();
  const suggest = () => startTransition(async () => {
    const res = await suggestListingPrice({ type: draft.type, purpose: draft.purpose, areaSqft: draft.areaSqft ?? 0, neighbourhoodId: draft.neighbourhoodId ?? "" });
    if (res.ok) setSuggestion(res.data); else toast.error(res.error);
  });
  return (
    <div className="space-y-6">
      <label className="block max-w-sm text-sm">{draft.purpose === "rent" ? "Monthly rent (PKR)" : "Asking price (PKR)"}
        <Input type="number" min={1} value={draft.price ?? ""} onChange={(e) => set({ price: num(e.target.value) })} className="tabular mt-1.5 h-11" />
        {draft.price ? <span className="mt-1 block text-xs text-muted-foreground">{formatPrice(draft.price, { compact: true, purpose: draft.purpose })}</span> : null}
      </label>
      {draft.purpose === "rent" && (
        <div className="grid max-w-sm grid-cols-2 gap-4">
          <label className="text-sm">Deposit (months)<Input type="number" min={0} max={12} value={draft.depositMonths ?? 2} onChange={(e) => set({ depositMonths: num(e.target.value) ?? null })} className="mt-1.5 h-11" /></label>
          <label className="text-sm">Advance (months)<Input type="number" min={0} max={12} value={draft.advanceMonths ?? 1} onChange={(e) => set({ advanceMonths: num(e.target.value) ?? null })} className="mt-1.5 h-11" /></label>
        </div>
      )}
      <div className="rounded-xl bg-muted p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p>Suggested range from comparable homes</p>
          <Button type="button" variant="outline" size="sm" onClick={suggest} disabled={pending}>{pending ? "Checking…" : suggestion ? "Recalculate" : "Suggest a price"}</Button>
        </div>
        {suggestion && (
          <div className="mt-4">
            <p className="tabular font-display text-3xl tracking-[-0.03em]">{formatPrice(suggestion.low, { compact: true })} – {formatPrice(suggestion.high, { compact: true, purpose: draft.purpose })}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {suggestion.basis.kind === "comparables" ? `Median of ${suggestion.basis.count} similar listings nearby` : "Based on the neighbourhood's typical rate"} · {formatPrice(suggestion.perSqft)} / sq ft
            </p>
            <Button type="button" size="sm" className="mt-3" onClick={() => set({ price: suggestion.mid })}>Use {formatPrice(suggestion.mid, { compact: true })}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
