"use client";

import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AMENITIES, PROPERTY_TYPES, type SearchFilters } from "@/lib/data/types";
import { amenityLabels, typeLabels } from "@/lib/labels";
import { formatPrice, sqftTo, toSqft } from "@/lib/format";
import { filtersToSearchParams } from "@/lib/search/params";
import { locale, type AreaUnit } from "@/config/locale";
import { getJson } from "@/lib/realtime";
import { cn } from "@/lib/utils";

const PRICE_STEPS = {
  sale: [50e5, 1e7, 2e7, 3.5e7, 5e7, 7.5e7, 1e8, 2e8, 4e8],
  rent: [3e4, 5e4, 7.5e4, 1e5, 1.5e5, 2.5e5, 4e5, 6e5, 1e6],
};

const chip = "rounded-full border px-3.5 py-1.5 text-sm transition-colors";
const chipOn = "border-primary bg-primary text-primary-foreground";
const chipOff = "border-hairline hover:border-foreground/40";
const select = "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-border py-5 first:border-t-0 first:pt-0">
      <legend className="mono-label mb-3 text-[0.6875rem] text-meta">{title}</legend>
      {children}
    </fieldset>
  );
}

function Segmented<T extends string | number | undefined>({ id, options, value, onChange }: { id: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" className="inline-flex flex-wrap rounded-full border border-hairline p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={String(o.value)} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)}
            className={cn("relative rounded-full px-4 py-1.5 text-sm transition-colors", on ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
            {on && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const toggleIn = <T,>(list: T[] | undefined, v: T) => {
  const next = list?.includes(v) ? list.filter((x) => x !== v) : [...(list ?? []), v];
  return next.length ? next : undefined;
};

interface FilterPanelProps {
  value: SearchFilters;
  neighbourhoods: { id: string; name: string }[];
  onApply: (f: SearchFilters) => void;
}

/** Edits a draft copy of the filters and shows a live match count before applying. */
export function FilterPanel({ value, neighbourhoods, onApply }: FilterPanelProps) {
  const [draft, setDraft] = useState<SearchFilters>(value);
  const [unit, setUnit] = useState<AreaUnit>(locale.defaultAreaUnit);
  useEffect(() => {
    setDraft(value);
  }, [value]);
  const set = (patch: Partial<SearchFilters>) => setDraft((d) => ({ ...d, ...patch }));

  const qs = filtersToSearchParams(draft).toString();
  const count = useQuery({
    queryKey: ["count", qs],
    queryFn: () => getJson<{ total: number }>(`/api/listings?pageSize=1&${qs}`),
    placeholderData: keepPreviousData,
  });

  const steps = PRICE_STEPS[draft.purpose ?? "sale"];
  const areaValue = (sqft?: number) => (sqft ? String(+sqftTo(sqft, unit).toFixed(1)) : "");
  const areaInput = (key: "minAreaSqft" | "maxAreaSqft") => (e: React.ChangeEvent<HTMLInputElement>) =>
    set({ [key]: e.target.value ? toSqft(Number(e.target.value), unit) : undefined });

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <Section title="Looking to">
          <Segmented id="purpose" value={draft.purpose} onChange={(purpose) => set({ purpose, minPrice: undefined, maxPrice: undefined })}
            options={[{ value: undefined, label: "Any" }, { value: "sale", label: "Buy" }, { value: "rent", label: "Rent" }]} />
        </Section>

        <Section title="Property type">
          <div className="flex flex-wrap gap-2">
            {PROPERTY_TYPES.map((t) => (
              <button key={t} type="button" aria-pressed={!!draft.types?.includes(t)} onClick={() => set({ types: toggleIn(draft.types, t) })}
                className={cn(chip, draft.types?.includes(t) ? chipOn : chipOff)}>{typeLabels[t]}</button>
            ))}
          </div>
        </Section>

        <Section title="Neighbourhood">
          <div className="flex flex-wrap gap-2">
            {neighbourhoods.map((n) => (
              <button key={n.id} type="button" aria-pressed={!!draft.neighbourhoodIds?.includes(n.id)} onClick={() => set({ neighbourhoodIds: toggleIn(draft.neighbourhoodIds, n.id) })}
                className={cn(chip, draft.neighbourhoodIds?.includes(n.id) ? chipOn : chipOff)}>{n.name}</button>
            ))}
          </div>
        </Section>

        <Section title={draft.purpose === "rent" ? "Monthly rent" : "Price"}>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="sr-only">Minimum price</span>
              <select className={select} value={draft.minPrice ?? ""} onChange={(e) => set({ minPrice: e.target.value ? Number(e.target.value) : undefined })}>
                <option value="">No min</option>
                {steps.map((s) => <option key={s} value={s}>{formatPrice(s, { compact: true })}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="sr-only">Maximum price</span>
              <select className={select} value={draft.maxPrice ?? ""} onChange={(e) => set({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}>
                <option value="">No max</option>
                {steps.filter((s) => !draft.minPrice || s > draft.minPrice).map((s) => <option key={s} value={s}>{formatPrice(s, { compact: true })}</option>)}
              </select>
            </label>
          </div>
        </Section>

        <Section title="Bedrooms">
          <Segmented id="beds" value={draft.minBeds} onChange={(minBeds) => set({ minBeds })}
            options={[{ value: undefined, label: "Any" }, ...[1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n}+` }))]} />
        </Section>
        <Section title="Bathrooms">
          <Segmented id="baths" value={draft.minBaths} onChange={(minBaths) => set({ minBaths })}
            options={[{ value: undefined, label: "Any" }, ...[1, 2, 3, 4].map((n) => ({ value: n, label: `${n}+` }))]} />
        </Section>

        <Section title="Area">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-3">
            <input type="number" min={0} inputMode="decimal" placeholder="Min" aria-label={`Minimum area in ${locale.areaUnits[unit].label}`}
              value={areaValue(draft.minAreaSqft)} onChange={areaInput("minAreaSqft")} className={select} />
            <input type="number" min={0} inputMode="decimal" placeholder="Max" aria-label={`Maximum area in ${locale.areaUnits[unit].label}`}
              value={areaValue(draft.maxAreaSqft)} onChange={areaInput("maxAreaSqft")} className={select} />
            <select aria-label="Area unit" className={cn(select, "w-auto")} value={unit} onChange={(e) => setUnit(e.target.value as AreaUnit)}>
              {(Object.keys(locale.areaUnits) as AreaUnit[]).map((u) => <option key={u} value={u}>{locale.areaUnits[u].label}</option>)}
            </select>
          </div>
        </Section>

        <Section title="Must have">
          <div className="space-y-3">
            {([["furnished", "Furnished"], ["petsAllowed", "Pets allowed"], ["parking", "Parking"], ["verifiedOnly", "Verified listings only"]] as const).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-4 text-sm">
                {label}
                <Switch checked={!!draft[key]} onCheckedChange={(v) => set({ [key]: v || undefined })} />
              </label>
            ))}
          </div>
        </Section>

        <Section title="Amenities">
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => (
              <button key={a} type="button" aria-pressed={!!draft.amenities?.includes(a)} onClick={() => set({ amenities: toggleIn(draft.amenities, a) })}
                className={cn(chip, "px-3 py-1 text-[0.8125rem]", draft.amenities?.includes(a) ? chipOn : chipOff)}>{amenityLabels[a]}</button>
            ))}
          </div>
        </Section>

        <Section title="Listed by">
          <Segmented id="by" value={draft.listedBy} onChange={(listedBy) => set({ listedBy })}
            options={[{ value: undefined, label: "Anyone" }, { value: "owner", label: "Owner" }, { value: "agent", label: "Agent" }]} />
        </Section>
        <Section title="Date listed">
          <Segmented id="days" value={draft.listedWithinDays} onChange={(listedWithinDays) => set({ listedWithinDays })}
            options={[{ value: undefined, label: "Any time" }, { value: 1, label: "24 h" }, { value: 7, label: "7 days" }, { value: 30, label: "30 days" }]} />
        </Section>
      </div>

      <div className="flex items-center gap-3 border-t border-border bg-background px-5 py-4">
        <Button variant="ghost" onClick={() => setDraft({ sort: value.sort, polygon: value.polygon })}>Clear all</Button>
        <Button size="xl" className="flex-1" onClick={() => onApply(draft)} aria-live="polite">
          {count.data ? `Show ${count.data.total} home${count.data.total === 1 ? "" : "s"}` : "Show homes"}
        </Button>
      </div>
    </div>
  );
}
