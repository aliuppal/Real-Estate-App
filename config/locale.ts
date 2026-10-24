/**
 * Single source of truth for currency, area units and the market the seed data
 * describes. Prices are stored in `baseCurrency`; areas are stored in square feet.
 */

export type CurrencyCode = "PKR" | "USD";
export type AreaUnit = "sqft" | "sqm" | "marla" | "kanal";

export const locale = {
  /** BCP-47 tag used for Intl number formatting. */
  intl: "en-PK",
  city: "Lahore",
  country: "Pakistan",

  baseCurrency: "PKR" as CurrencyCode,
  defaultCurrency: "PKR" as CurrencyCode,
  currencies: {
    PKR: { symbol: "Rs", label: "Pakistani Rupee", perBase: 1 },
    // Display-only conversion. Update the rate here; nothing else hardcodes it.
    USD: { symbol: "$", label: "US Dollar", perBase: 1 / 280 },
  } satisfies Record<CurrencyCode, { symbol: string; label: string; perBase: number }>,

  defaultAreaUnit: "marla" as AreaUnit,
  /** Square feet per unit. Lahore convention: 1 marla = 225 sq ft, 1 kanal = 20 marla. */
  areaUnits: {
    sqft: { label: "sq ft", short: "sq ft", sqftPer: 1 },
    sqm: { label: "sq m", short: "m²", sqftPer: 10.7639 },
    marla: { label: "Marla", short: "marla", sqftPer: 225 },
    kanal: { label: "Kanal", short: "kanal", sqftPer: 4500 },
  } satisfies Record<AreaUnit, { label: string; short: string; sqftPer: number }>,

  /** South-Asian compact notation (lakh / crore) for the base currency. */
  useLakhCrore: true,

  map: {
    center: [31.4697, 74.3112] as [number, number],
    zoom: 12,
  },
} as const;
