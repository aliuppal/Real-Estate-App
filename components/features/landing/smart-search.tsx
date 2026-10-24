"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, MapPin, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PROPERTY_TYPES, type PropertyType, type Purpose, type SearchFilters } from "@/lib/data/types";
import { typeLabels } from "@/lib/labels";
import { formatPrice } from "@/lib/format";
import { parseQuery } from "@/lib/search/nl-parser";
import { searchHref } from "@/lib/search/params";
import { cn } from "@/lib/utils";

type Tab = Purpose | "sell";
type Place = { id: string; name: string; count: number };

const TABS: { id: Tab; label: string }[] = [
  { id: "sale", label: "Buy" },
  { id: "rent", label: "Rent" },
  { id: "sell", label: "Sell" },
];

const PRICE_STEPS: Record<Purpose, number[]> = {
  sale: [50e5, 1e7, 2e7, 3.5e7, 5e7, 1e8, 2e8],
  rent: [5e4, 1e5, 1.5e5, 2.5e5, 4e5, 6e5],
};

const EASE = [0.22, 1, 0.36, 1] as const;

const fieldLabel = "mono-label block text-[0.6875rem] text-meta";
const fieldControl = "mt-1 w-full appearance-none bg-transparent text-[0.95rem] text-foreground outline-none";

export function SmartSearch({ places }: { places: Place[] }) {
  const router = useRouter();
  const ids = useId();
  const [tab, setTab] = useState<Tab>("sale");
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [placeOpen, setPlaceOpen] = useState(false);
  const [activeOption, setActiveOption] = useState(0);
  const [type, setType] = useState<PropertyType | "">("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [beds, setBeds] = useState("");
  const [nl, setNl] = useState("");

  const purpose: Purpose = tab === "rent" ? "rent" : "sale";
  const steps = PRICE_STEPS[purpose];
  const matches = useMemo(
    () => places.filter((p) => p.name.toLowerCase().includes(placeQuery.trim().toLowerCase())),
    [places, placeQuery],
  );
  const parsed = useMemo(() => (nl.trim().length > 2 ? parseQuery(nl) : null), [nl]);

  const choosePlace = (p: Place) => {
    setPlaceId(p.id);
    setPlaceQuery(p.name);
    setPlaceOpen(false);
  };

  const submitStructured = (e: React.FormEvent) => {
    e.preventDefault();
    const filters: SearchFilters = {
      purpose,
      neighbourhoodIds: placeId ? [placeId] : undefined,
      // Free text that didn't match a neighbourhood still searches titles and addresses.
      q: !placeId && placeQuery.trim() ? placeQuery.trim() : undefined,
      types: type ? [type] : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minBeds: beds ? Number(beds) : undefined,
    };
    router.push(searchHref(filters));
  };

  const submitNatural = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsed) return;
    router.push(searchHref({ purpose: tab === "sell" ? undefined : purpose, ...parsed.filters }));
  };

  const onPlaceKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!placeOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) setPlaceOpen(true);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveOption((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveOption((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && placeOpen && matches[activeOption]) {
      e.preventDefault();
      choosePlace(matches[activeOption]);
    } else if (e.key === "Escape") {
      setPlaceOpen(false);
    }
  };

  const listboxId = `${ids}-places`;
  const optionId = (i: number) => `${ids}-place-${i}`;

  return (
    <div className="rounded-media border border-hairline bg-card p-2 text-left">
      <div role="tablist" aria-label="What would you like to do?" className="flex gap-1 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`${ids}-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`${ids}-panel`}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative rounded-full px-5 py-2 text-sm transition-colors duration-200",
              tab === t.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab === t.id && (
              // Shared layoutId: framer animates the pill between tabs with a transform (FLIP).
              <motion.span layoutId="hero-search-tab" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 420, damping: 36 }} />
            )}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      <div id={`${ids}-panel`} role="tabpanel" aria-labelledby={`${ids}-tab-${tab}`}>
        <AnimatePresence mode="wait" initial={false}>
          {tab === "sell" ? (
            <motion.div
              key="sell"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="grid gap-2 p-2 sm:grid-cols-2"
            >
              {[
                { href: "/dashboard/listings/new", title: "List it yourself", body: "A guided listing with a suggested price from comparable homes nearby." },
                { href: "/match?goal=sell", title: "Let an agent sell it", body: "Get matched with agents who've sold in your neighbourhood." },
              ].map((o) => (
                <Link key={o.href} href={o.href} className="group rounded-xl bg-muted p-5 transition-colors hover:bg-secondary">
                  <span className="flex items-center justify-between text-lg">
                    {o.title}
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">{o.body}</span>
                </Link>
              ))}
            </motion.div>
          ) : (
            <motion.div key="find" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: EASE }}>
              <form onSubmit={submitStructured} className="grid grid-cols-2 gap-px overflow-visible rounded-xl bg-hairline md:grid-cols-[1.6fr_1fr_1fr_1fr_0.8fr_auto]">
                <div className="relative col-span-2 bg-card px-4 py-3 md:col-span-1">
                  <label htmlFor={`${ids}-place`} className={fieldLabel}>Location</label>
                  <div className="flex items-center gap-2">
                    <MapPin className="mt-1 size-4 shrink-0 text-meta" aria-hidden />
                    <input
                      id={`${ids}-place`}
                      role="combobox"
                      aria-expanded={placeOpen}
                      aria-controls={listboxId}
                      aria-autocomplete="list"
                      aria-activedescendant={placeOpen && matches[activeOption] ? optionId(activeOption) : undefined}
                      autoComplete="off"
                      placeholder="Anywhere in Lahore"
                      value={placeQuery}
                      onChange={(e) => {
                        setPlaceQuery(e.target.value);
                        setPlaceId(null);
                        setPlaceOpen(true);
                        setActiveOption(0);
                      }}
                      onFocus={() => setPlaceOpen(true)}
                      onBlur={() => setTimeout(() => setPlaceOpen(false), 120)}
                      onKeyDown={onPlaceKey}
                      className={fieldControl}
                    />
                  </div>
                  <AnimatePresence>
                    {placeOpen && matches.length > 0 && (
                      <motion.ul
                        id={listboxId}
                        role="listbox"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18 }}
                        className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-hairline bg-popover p-1 shadow-xl"
                      >
                        {matches.map((p, i) => (
                          <li
                            key={p.id}
                            id={optionId(i)}
                            role="option"
                            aria-selected={i === activeOption}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              choosePlace(p);
                            }}
                            onMouseEnter={() => setActiveOption(i)}
                            className={cn("flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm", i === activeOption && "bg-muted")}
                          >
                            {p.name}
                            <span className="mono-label text-[0.6875rem] text-meta">{p.count} homes</span>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

                <div className="bg-card px-4 py-3">
                  <label htmlFor={`${ids}-type`} className={fieldLabel}>Type</label>
                  <select id={`${ids}-type`} value={type} onChange={(e) => setType(e.target.value as PropertyType | "")} className={fieldControl}>
                    <option value="">Any type</option>
                    {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{typeLabels[t]}</option>)}
                  </select>
                </div>
                <div className="bg-card px-4 py-3">
                  <label htmlFor={`${ids}-min`} className={fieldLabel}>Min price</label>
                  <select id={`${ids}-min`} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className={fieldControl}>
                    <option value="">No min</option>
                    {steps.map((s) => <option key={s} value={s}>{formatPrice(s, { compact: true })}</option>)}
                  </select>
                </div>
                <div className="bg-card px-4 py-3">
                  <label htmlFor={`${ids}-max`} className={fieldLabel}>Max price</label>
                  <select id={`${ids}-max`} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className={fieldControl}>
                    <option value="">No max</option>
                    {steps.filter((s) => !minPrice || s > Number(minPrice)).map((s) => (
                      <option key={s} value={s}>{formatPrice(s, { compact: true, purpose })}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-card px-4 py-3">
                  <label htmlFor={`${ids}-beds`} className={fieldLabel}>Beds</label>
                  <select id={`${ids}-beds`} value={beds} onChange={(e) => setBeds(e.target.value)} className={fieldControl}>
                    <option value="">Any</option>
                    {[1, 2, 3, 4, 5].map((b) => <option key={b} value={b}>{b}+</option>)}
                  </select>
                </div>
                <div className="col-span-2 flex items-center bg-card p-2 md:col-span-1">
                  <Button type="submit" size="xl" className="w-full md:w-auto">
                    <Search className="size-4" aria-hidden /> Search
                  </Button>
                </div>
              </form>

              <form onSubmit={submitNatural} className="mt-2 flex items-center gap-3 rounded-xl bg-muted px-4 py-3">
                <Sparkles className="size-4 shrink-0 text-brand dark:text-[#4cc3a4]" aria-hidden />
                <label htmlFor={`${ids}-nl`} className="sr-only">Describe the home you want in plain English</label>
                <input
                  id={`${ids}-nl`}
                  value={nl}
                  onChange={(e) => setNl(e.target.value)}
                  placeholder="Or just describe it: 3 bed house near a school under 2 crore with a garden"
                  className="min-w-0 flex-1 bg-transparent text-[0.95rem] outline-none placeholder:text-meta"
                />
                <button type="submit" disabled={!parsed?.understood.length} className="shrink-0 text-sm underline underline-offset-4 disabled:no-underline disabled:opacity-40">
                  Search
                </button>
              </form>
              <div aria-live="polite" className="flex min-h-9 flex-wrap items-center gap-1.5 px-3 pt-2">
                <AnimatePresence initial={false}>
                  {parsed?.understood.map((chip) => (
                    <motion.span
                      key={chip}
                      layout="position"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.2, ease: EASE }}
                      className="rounded-full border border-hairline px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {chip}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
