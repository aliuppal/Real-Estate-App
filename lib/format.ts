import { locale, type AreaUnit, type CurrencyCode } from "@/config/locale";
import type { Purpose } from "@/lib/data/types";

const LAKH = 100_000;
const CRORE = 10_000_000;

const trim = (n: number, digits: number) =>
  Number(n.toFixed(digits)).toLocaleString(locale.intl, { maximumFractionDigits: digits });

export interface PriceFormatOptions {
  currency?: CurrencyCode;
  /** "Rs 2.45 Crore" instead of "Rs 24,500,000". */
  compact?: boolean;
  /** Appends "/mo" for rentals. */
  purpose?: Purpose;
}

/** Formats a price stored in the base currency. */
export function formatPrice(amount: number, opts: PriceFormatOptions = {}): string {
  const currency = opts.currency ?? locale.defaultCurrency;
  const { symbol, perBase } = locale.currencies[currency];
  const value = amount * perBase;
  const suffix = opts.purpose === "rent" ? "/mo" : "";

  if (opts.compact) {
    if (currency === "PKR" && locale.useLakhCrore) {
      if (value >= CRORE) return `${symbol} ${trim(value / CRORE, 2)} Crore${suffix}`;
      if (value >= LAKH) return `${symbol} ${trim(value / LAKH, 2)} Lakh${suffix}`;
    } else {
      if (value >= 1_000_000) return `${symbol}${trim(value / 1_000_000, 2)}M${suffix}`;
      if (value >= 1_000) return `${symbol}${trim(value / 1_000, 1)}K${suffix}`;
    }
  }

  const sep = currency === "PKR" ? " " : "";
  return `${symbol}${sep}${Math.round(value).toLocaleString(locale.intl)}${suffix}`;
}

export const sqftTo = (sqft: number, unit: AreaUnit) => sqft / locale.areaUnits[unit].sqftPer;
export const toSqft = (value: number, unit: AreaUnit) => Math.round(value * locale.areaUnits[unit].sqftPer);

export function formatArea(sqft: number, unit: AreaUnit = locale.defaultAreaUnit): string {
  const digits = unit === "marla" || unit === "kanal" ? 1 : 0;
  return `${trim(sqftTo(sqft, unit), digits)} ${locale.areaUnits[unit].short}`;
}

/** "5 Marla" / "1 Kanal" / "1.5 Kanal", the way plots are described locally. */
export function plotSizeLabel(sqft: number): string {
  const marla = sqftTo(sqft, "marla");
  if (marla >= 20) return `${trim(marla / 20, 1)} Kanal`;
  return `${trim(marla, 0)} Marla`;
}

export function formatRelativeDate(iso: string, now = Date.now()): string {
  const mins = Math.round((now - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;
  return new Date(iso).toLocaleDateString(locale.intl, { day: "numeric", month: "short" });
}

export function formatResponseTime(mins: number): string {
  if (mins < 60) return `within ${mins} min`;
  return `within ${Math.round(mins / 60)} h`;
}
