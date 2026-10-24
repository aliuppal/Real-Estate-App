import type { Amenity, PropertyType, SearchFilters } from "@/lib/data/types";
import { locale } from "@/config/locale";

/**
 * "Search in plain English" → SearchFilters.
 * Keyword/regex today; an LLM-backed `NaturalLanguageParser` can replace it without touching callers.
 */
export interface ParsedQuery {
  filters: SearchFilters;
  /** Human-readable chips for what was understood, in input order. */
  understood: string[];
}

export interface NaturalLanguageParser {
  parse(text: string): Promise<ParsedQuery>;
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

const TYPE_WORDS: [RegExp, PropertyType, string][] = [
  [/\b(villas?|mansions?)\b/, "villa", "Villa"],
  [/\b(apartments?|flats?|penthouses?|studios?)\b/, "apartment", "Apartment"],
  [/\b(plots?|land|files?)\b/, "plot", "Plot"],
  [/\b(offices?|shops?|showrooms?|commercial|retail)\b/, "commercial", "Commercial"],
  // "home(s)" is deliberately absent: it's generic and shouldn't narrow results to houses.
  [/\b(houses?|bungalows?|townhouses?)\b/, "house", "House"],
];

const AMENITY_WORDS: [RegExp, Amenity, string][] = [
  [/\b(garden|lawn|yard)\b/, "garden", "Garden"],
  [/\b(pool|swimming)\b/, "pool", "Pool"],
  [/\bgym\b/, "gym", "Gym"],
  [/\bschools?\b/, "near_school", "Near a school"],
  [/\bpark facing\b/, "park_facing", "Park facing"],
  [/\bparks?\b(?! facing)/, "near_park", "Near a park"],
  [/\b(mosque|masjid)\b/, "near_mosque", "Near a mosque"],
  [/\bhospital\b/, "near_hospital", "Near a hospital"],
  [/\bsolar\b/, "solar", "Solar"],
  [/\bbasement\b/, "basement", "Basement"],
  [/\b(lift|elevator)\b/, "lift", "Lift"],
  [/\b(security|gated|guarded)\b/, "security", "Security"],
  [/\bcorner\b/, "corner", "Corner"],
  [/\bbalcony\b/, "balcony", "Balcony"],
  [/\b(servant|maid)('?s)? quarters?\b/, "servant_quarter", "Servant quarter"],
  [/\b(generator|backup|ups)\b/, "backup_power", "Backup power"],
  [/\b(ac|air.?condition(ed|ing)?)\b/, "air_conditioning", "Air conditioning"],
  [/\b(study|home office)\b/, "study", "Study"],
  [/\b(roof ?top|terrace)\b/, "rooftop", "Rooftop"],
];

const PLACE_WORDS: [RegExp, string, string][] = [
  [/\b(dha|defen[cs]e)\b/, "nb-dha-phase-6", "DHA Phase 6"],
  [/\bgulberg\b/, "nb-gulberg", "Gulberg III"],
  [/\bmodel town\b/, "nb-model-town", "Model Town"],
  [/\bjohar\b/, "nb-johar-town", "Johar Town"],
  [/\bbahria\b/, "nb-bahria-town", "Bahria Town"],
];

const UNIT_MULTIPLIER: Record<string, number> = {
  k: 1e3, thousand: 1e3, l: 1e5, lac: 1e5, lacs: 1e5, lakh: 1e5, lakhs: 1e5,
  m: 1e6, mn: 1e6, million: 1e6, cr: 1e7, crore: 1e7, crores: 1e7,
};
const AMOUNT = String.raw`(?:rs\.?|pkr|\$)?\s*(\d+(?:\.\d+)?)\s*(k|thousand|lacs?|lakhs?|l|mn|m|million|cr|crores?)?\b`;

function toAmount(value: string, unit?: string): number {
  return Math.round(Number(value) * (unit ? UNIT_MULTIPLIER[unit] ?? 1 : 1));
}

const formatShort = (n: number) =>
  n >= 1e7 ? `${+(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `${+(n / 1e5).toFixed(2)} Lakh` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}k` : `${n}`;

export function parseQuery(input: string): ParsedQuery {
  const text = ` ${input.toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ")} `.replace(
    /\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/g,
    (w) => String(NUMBER_WORDS[w]),
  );
  const filters: SearchFilters = {};
  const understood: string[] = [];

  if (/\b(rent|rental|renting|lease|to let|per month|monthly|\/mo)\b/.test(text)) {
    filters.purpose = "rent";
    understood.push("To rent");
  } else if (/\b(buy|buying|purchase|for sale|on sale|own)\b/.test(text)) {
    filters.purpose = "sale";
    understood.push("To buy");
  }

  const beds = text.match(/\b(\d+)\s*\+?\s*(?:-|\s)?(?:bed(?:room)?s?|bhk|br)\b/);
  if (beds) {
    filters.minBeds = Number(beds[1]);
    understood.push(`${filters.minBeds}+ beds`);
  }
  const baths = text.match(/\b(\d+)\s*\+?\s*(?:-|\s)?(?:bath(?:room)?s?|washrooms?)\b/);
  if (baths) {
    filters.minBaths = Number(baths[1]);
    understood.push(`${filters.minBaths}+ baths`);
  }

  const picked = TYPE_WORDS.filter(([re]) => re.test(text));
  if (picked.length) {
    filters.types = [...new Set(picked.map(([, t]) => t))];
    understood.push(...picked.map(([, , label]) => label));
  }

  const between = text.match(new RegExp(String.raw`\bbetween\s+${AMOUNT}\s*(?:and|-|to)\s*${AMOUNT}`));
  if (between) {
    // A unit on the upper bound applies to a bare lower bound: "between 1 and 2 crore".
    filters.minPrice = toAmount(between[1], between[2] ?? between[4]);
    filters.maxPrice = toAmount(between[3], between[4]);
    understood.push(`${formatShort(filters.minPrice)} to ${formatShort(filters.maxPrice)}`);
  } else {
    const max = text.match(new RegExp(String.raw`\b(?:under|below|less than|max(?:imum)?|up ?to|within|budget(?: of)?|no more than)\s+${AMOUNT}`));
    if (max) {
      filters.maxPrice = toAmount(max[1], max[2]);
      understood.push(`Under ${formatShort(filters.maxPrice)}`);
    }
    const min = text.match(new RegExp(String.raw`\b(?:over|above|more than|min(?:imum)?|at least|from)\s+${AMOUNT}`));
    if (min) {
      filters.minPrice = toAmount(min[1], min[2]);
      understood.push(`Over ${formatShort(filters.minPrice)}`);
    }
  }

  const area = text.match(/\b(\d+(?:\.\d+)?)\s*(marlas?|kanals?|sq\.? ?ft|sqft|square feet|sq\.? ?m|sqm|square met(?:er|re)s?)\b/);
  if (area) {
    const unit = area[2].startsWith("marla") ? "marla" : area[2].startsWith("kanal") ? "kanal" : /m$|met/.test(area[2]) ? "sqm" : "sqft";
    filters.minAreaSqft = Math.round(Number(area[1]) * locale.areaUnits[unit].sqftPer);
    understood.push(`${area[1]} ${locale.areaUnits[unit].label}+`);
  }

  const amenities = AMENITY_WORDS.filter(([re]) => re.test(text));
  if (amenities.length) {
    filters.amenities = amenities.map(([, a]) => a);
    understood.push(...amenities.map(([, , label]) => label));
  }

  const places = PLACE_WORDS.filter(([re]) => re.test(text));
  if (places.length) {
    filters.neighbourhoodIds = places.map(([, id]) => id);
    understood.push(...places.map(([, , label]) => label));
  }

  if (/\bfurnished\b/.test(text) && !/\bun-?furnished\b/.test(text)) {
    filters.furnished = true;
    understood.push("Furnished");
  }
  if (/\b(pets?|cats?|dogs?)\b/.test(text)) {
    filters.petsAllowed = true;
    understood.push("Pets allowed");
  }
  if (/\b(parking|garage|car porch)\b/.test(text)) {
    filters.parking = true;
    understood.push("Parking");
  }
  if (/\bverified\b/.test(text)) {
    filters.verifiedOnly = true;
    understood.push("Verified only");
  }
  if (/\b(new|newly listed|this week|recent)\b/.test(text) && !/\bnew ?build\b/.test(text)) {
    filters.listedWithinDays = 7;
    understood.push("Listed this week");
  }

  return { filters, understood };
}

export const keywordParser: NaturalLanguageParser = { parse: async (text) => parseQuery(text) };
