"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Columns2, LayoutGrid, Map as MapIcon, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { SearchFilters, SortKey } from "@/lib/data/types";
import { activeFilterCount, filterChips, SORT_LABELS } from "@/lib/search/describe";
import { parseQuery } from "@/lib/search/nl-parser";
import { cn } from "@/lib/utils";
import { FilterPanel } from "./filter-panel";
import { SaveSearchButton } from "./save-search-dialog";

export type ViewMode = "split" | "list" | "map";

interface ToolbarProps {
  filters: SearchFilters;
  onChange: (f: SearchFilters) => void;
  total: number | null;
  nbNames: Record<string, string>;
  neighbourhoods: { id: string; name: string }[];
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  isDesktop: boolean;
}

export function SearchToolbar({ filters, onChange, total, nbNames, neighbourhoods, view, onViewChange, isDesktop }: ToolbarProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const chips = filterChips(filters, nbNames);
  const count = activeFilterCount(filters);

  const submitText = (e: React.FormEvent) => {
    e.preventDefault();
    const { filters: parsed, understood } = parseQuery(text);
    // Text the parser didn't recognise still searches titles and addresses.
    onChange({ ...filters, ...(understood.length ? parsed : { q: text.trim() || undefined }) });
    setText("");
  };

  return (
    <div className="border-b border-border bg-background">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
        <form onSubmit={submitText} className="flex h-10 min-w-0 flex-1 basis-full items-center gap-2 rounded-full bg-muted px-4 sm:basis-auto">
          <Sparkles className="size-4 shrink-0 text-brand dark:text-[#4cc3a4]" aria-hidden />
          <label htmlFor="search-text" className="sr-only">Describe what you&apos;re looking for</label>
          <input id="search-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Try “2 bed flat in Gulberg under 1.5 lakh”"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-meta" />
        </form>

        <div role="radiogroup" aria-label="Buy or rent" className="inline-flex rounded-full border border-hairline p-1">
          {([[undefined, "All"], ["sale", "Buy"], ["rent", "Rent"]] as const).map(([v, label]) => (
            <button key={label} type="button" role="radio" aria-checked={filters.purpose === v}
              onClick={() => onChange({ ...filters, purpose: v, minPrice: undefined, maxPrice: undefined })}
              className={cn("relative rounded-full px-3.5 py-1 text-sm", filters.purpose === v ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {filters.purpose === v && <motion.span layoutId="tb-purpose" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>

        <Button variant="outline" className="h-10 rounded-full px-4" onClick={() => setOpen(true)}>
          <SlidersHorizontal className="size-4" aria-hidden /> Filters
          {count > 0 && <span className="grid size-5 place-items-center rounded-full bg-primary text-[0.6875rem] text-primary-foreground">{count}</span>}
        </Button>

        <label className="sr-only" htmlFor="search-sort">Sort by</label>
        <select id="search-sort" value={filters.sort ?? "newest"} onChange={(e) => onChange({ ...filters, sort: e.target.value as SortKey })}
          className="h-10 rounded-full border border-hairline bg-background px-3 text-sm">
          {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => <option key={k} value={k}>{SORT_LABELS[k]}</option>)}
        </select>

        <SaveSearchButton filters={filters} nbNames={nbNames} compact={!isDesktop} />

        {isDesktop && (
          <div role="radiogroup" aria-label="Layout" className="ml-auto inline-flex rounded-full border border-hairline p-1">
            {([["list", LayoutGrid, "List only"], ["split", Columns2, "List and map"], ["map", MapIcon, "Map only"]] as const).map(([v, Icon, label]) => (
              <button key={v} type="button" role="radio" aria-checked={view === v} aria-label={label} onClick={() => onViewChange(v)}
                className={cn("relative grid size-8 place-items-center rounded-full", view === v ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {view === v && <motion.span layoutId="tb-view" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                <Icon className="relative size-4" aria-hidden />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:px-6">
        <p className="shrink-0 text-sm" aria-live="polite">
          {total === null ? "Searching…" : <><span className="tabular">{total}</span> home{total === 1 ? "" : "s"}</>}
        </p>
        <AnimatePresence initial={false}>
          {chips.map((c) => (
            <motion.button key={c.key} type="button" layout="position" onClick={() => onChange(c.remove(filters))}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.18 }}
              aria-label={`Remove filter: ${c.label}`}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground hover:bg-secondary/70">
              {c.label} <X className="size-3" aria-hidden />
            </motion.button>
          ))}
        </AnimatePresence>
        {chips.length > 1 && (
          <button type="button" onClick={() => onChange({ sort: filters.sort })} className="shrink-0 text-xs underline underline-offset-4">Clear all</button>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side={isDesktop ? "right" : "bottom"} className={cn("gap-0 p-0", isDesktop ? "w-full sm:max-w-md" : "h-[88dvh] rounded-t-media")}>
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle className="text-xl font-normal">Filters</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 pt-5">
            <FilterPanel value={filters} neighbourhoods={neighbourhoods} onApply={(f) => { onChange(f); setOpen(false); }} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
