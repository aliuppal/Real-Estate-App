import type { Agent, Amenity, Listing, ListingStatus, Neighbourhood, PropertyType, Purpose } from "../../types";
import { describeListing } from "@/lib/listing-copy";
import { plotSizeLabel } from "@/lib/format";
import { APARTMENT_EXTERIORS, COMMERCIAL, HOUSE_EXTERIORS, INTERIORS, PLOTS, unsplash } from "./images";
import { createRandom, daysAgo, roundTo, type Random } from "./random";

const LISTING_COUNT = 64;
const MARLA = 225;

/** 16-slot cycle → 16 apartments, 24 houses, 8 villas, 8 plots, 8 commercial. */
const TYPE_CYCLE: PropertyType[] = [
  "house", "apartment", "house", "villa", "apartment", "house", "commercial", "plot",
  "house", "apartment", "house", "villa", "apartment", "house", "commercial", "plot",
];

const AREAS_FOR: Record<PropertyType, string[]> = {
  apartment: ["gulberg", "johar-town", "model-town", "bahria-town", "dha-phase-6"],
  house: ["dha-phase-6", "model-town", "johar-town", "bahria-town", "gulberg"],
  villa: ["dha-phase-6", "bahria-town", "gulberg"],
  plot: ["dha-phase-6", "bahria-town", "johar-town"],
  commercial: ["gulberg", "johar-town", "model-town", "dha-phase-6"],
};

const AMENITY_POOL: Record<PropertyType, Amenity[]> = {
  house: ["garden", "security", "backup_power", "servant_quarter", "basement", "rooftop", "solar", "gas",
    "near_school", "near_mosque", "near_park", "corner", "park_facing", "air_conditioning", "balcony", "study"],
  villa: ["garden", "pool", "gym", "security", "backup_power", "servant_quarter", "basement", "rooftop",
    "solar", "gas", "near_school", "park_facing", "air_conditioning", "study"],
  apartment: ["lift", "gym", "security", "backup_power", "balcony", "air_conditioning", "near_school",
    "near_hospital", "near_park", "rooftop", "pool"],
  plot: ["corner", "park_facing", "near_school", "near_mosque", "near_park", "gas"],
  commercial: ["lift", "security", "backup_power", "air_conditioning", "corner", "near_hospital"],
};

const PRICE_MULTIPLIER: Record<PropertyType, number> = {
  apartment: 0.95, house: 1, villa: 1.25, plot: 0.45, commercial: 1.35,
};

const ADJECTIVES = ["modern", "brand-new", "renovated", "sunlit", "spacious", "designer", "elegant", "bright"];

function address(nb: Neighbourhood, r: Random, isPlot: boolean): string {
  const no = r.int(1, 480);
  const prefix = isPlot ? `Plot ${no}` : `House ${no}`;
  switch (nb.slug) {
    case "dha-phase-6": return `${prefix}, Street ${r.int(1, 40)}, Sector ${r.pick("ABCDEFGHJKLMN".split(""))}, DHA Phase 6`;
    case "gulberg": return `${no} ${r.pick(["MM Alam", "Main Boulevard", "Mini Market", "Hali", "Ghalib"])} Road, Gulberg III`;
    case "model-town": return `${no}-${r.pick("ABCDEFGHJKLMNPQ".split(""))} Block, Model Town`;
    case "johar-town": return `${no} ${r.pick(["R-1", "J-2", "G-1", "E-2", "H-3", "Q"])} Block, Johar Town`;
    default: return `${no} ${r.pick(["Jasmine", "Tulip", "Overseas A", "Gulbahar", "Iris"])} Block, Sector ${r.pick(["C", "E", "F"])}, Bahria Town`;
  }
}

function sizeFor(type: PropertyType, r: Random) {
  switch (type) {
    case "apartment": {
      const beds = r.int(1, 4);
      return { beds, baths: Math.max(1, beds - r.int(0, 1)), areaSqft: roundTo(600 + beds * 380 + r.int(-80, 160), 10), plotSqft: null };
    }
    case "house": {
      const marla = r.pick([5, 5, 7, 10, 10, 12, 20]);
      const beds = Math.min(7, 2 + Math.round(marla / 4) + r.int(0, 1));
      return { beds, baths: beds + r.int(0, 1), areaSqft: roundTo(marla * MARLA * r.float(1.55, 1.85), 25), plotSqft: marla * MARLA };
    }
    case "villa": {
      const marla = r.pick([20, 20, 40]);
      const beds = marla === 40 ? r.int(6, 8) : r.int(5, 6);
      return { beds, baths: beds + 1, areaSqft: roundTo(marla * MARLA * r.float(1.3, 1.5), 50), plotSqft: marla * MARLA };
    }
    case "plot": {
      const marla = r.pick([5, 8, 10, 20, 40]);
      return { beds: 0, baths: 0, areaSqft: marla * MARLA, plotSqft: marla * MARLA };
    }
    case "commercial":
      return { beds: 0, baths: r.int(1, 4), areaSqft: roundTo(r.int(700, 6000), 50), plotSqft: null };
  }
}

type Size = ReturnType<typeof sizeFor>;

function titleFor(type: PropertyType, nb: Neighbourhood, size: Size, amenities: Amenity[], r: Random) {
  const land = size.plotSqft ? plotSizeLabel(size.plotSqft) : "";
  switch (type) {
    case "apartment": return `${size.beds}-bed apartment${amenities.includes("balcony") ? " with balcony" : ""}, ${nb.name}`;
    case "house": return `${land} ${r.pick(ADJECTIVES)} house in ${nb.name}`;
    case "villa": return `${land} ${amenities.includes("pool") ? "villa with pool" : `${r.pick(ADJECTIVES)} villa`} in ${nb.name}`;
    case "plot": return `${land} ${amenities.includes("corner") ? "corner " : ""}residential plot, ${nb.name}`;
    case "commercial": return `${r.pick(["Office floor", "Ground-floor shop", "Showroom", "Office suite"])} in ${nb.name}`;
  }
}

function imagesFor(type: PropertyType, i: number, r: Random, nb: Neighbourhood): string[] {
  const interiors = r.sample(INTERIORS, r.int(4, 6)).map((id) => unsplash(id));
  switch (type) {
    case "apartment": return [unsplash(APARTMENT_EXTERIORS[i % APARTMENT_EXTERIORS.length]), ...interiors];
    case "commercial": return [...COMMERCIAL.map((id) => unsplash(id)), ...interiors.slice(0, 2)];
    case "plot": return [unsplash(PLOTS[0]), nb.image];
    default: return [unsplash(HOUSE_EXTERIORS[(i * 7) % HOUSE_EXTERIORS.length]), ...interiors];
  }
}

function priceHistory(price: number, createdAt: string, r: Random, purpose: Purpose) {
  const step = purpose === "rent" ? 5_000 : 100_000;
  const start = new Date(createdAt).getTime();
  const span = Date.now() - start;
  const roll = r.next();
  if (roll < 0.28 && span > 5 * 86_400_000) {
    // Price drop: listed higher, reduced once or twice.
    const first = roundTo(price * r.float(1.05, 1.14), step);
    const points = [{ date: createdAt, price: first }];
    if (r.bool(0.4)) points.push({ date: new Date(start + span * 0.4).toISOString(), price: roundTo((first + price) / 2, step) });
    points.push({ date: new Date(start + span * 0.75).toISOString(), price });
    return points;
  }
  if (roll < 0.4 && span > 5 * 86_400_000) {
    return [
      { date: createdAt, price: roundTo(price * 0.96, step) },
      { date: new Date(start + span * 0.6).toISOString(), price },
    ];
  }
  return [{ date: createdAt, price }];
}

export function buildListings(neighbourhoods: Neighbourhood[], agents: Agent[]): Listing[] {
  const r = createRandom(20261024);
  const nbBySlug = new Map(neighbourhoods.map((n) => [n.slug, n]));
  const ownerPool = ["u-owner", "u-owner-2", "u-owner", "u-owner-3", "u-owner", "u-owner-4"];
  let ownerTurn = 0;

  return Array.from({ length: LISTING_COUNT }, (_, i): Listing => {
    const n = i + 1;
    const type = TYPE_CYCLE[i % TYPE_CYCLE.length];
    const areas = AREAS_FOR[type];
    const nb = nbBySlug.get(areas[(i + Math.floor(i / 16)) % areas.length])!;
    const purpose: Purpose =
      type === "plot" ? "sale" : type === "villa" ? (r.bool(0.7) ? "sale" : "rent") : r.bool(0.4) ? "sale" : "rent";
    const size = sizeFor(type, r);
    const amenities = r.sample(AMENITY_POOL[type], r.int(3, type === "plot" ? 4 : 8));
    const perSqft = purpose === "sale" ? nb.avgSalePerSqft : nb.avgRentPerSqft;
    const raw = size.areaSqft * perSqft * PRICE_MULTIPLIER[type] * r.float(0.85, 1.2);
    const price = purpose === "rent" ? roundTo(raw, 5_000) : roundTo(raw, raw > 10_000_000 ? 500_000 : 100_000);

    // The first 9 listings land in the last week so "New this week" has content.
    const createdAt = daysAgo(i < 9 ? r.float(0.2, 6.5) : r.float(7, 120));
    const age = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;

    const candidates = agents.filter((a) => a.serviceAreas.includes(nb.id) && a.purposes.includes(purpose));
    const specialists = candidates.filter((a) => a.specialties.includes(type));
    const pool = specialists.length ? specialists : candidates;
    const agent = r.bool(0.65) && pool.length ? r.pick(pool) : null;
    const ownerId = agent ? (n % 9 === 0 ? "u-owner" : null) : ownerPool[ownerTurn++ % ownerPool.length];

    let status: ListingStatus = "active";
    if (n % 23 === 0) status = purpose === "sale" ? "sold" : "rented";
    else if (n % 11 === 0) status = "under_offer";
    else if (!agent && ownerId === "u-owner" && n > 40 && n < 50) status = "draft";

    const furnished = type === "plot" || type === "commercial" ? false : r.bool(purpose === "rent" ? 0.45 : 0.1);
    const views = Math.round(r.int(40, 120) + age * r.int(8, 30));
    const title = titleFor(type, nb, size, amenities, r);

    return {
      id: `l-${n}`,
      slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${n}`,
      title,
      description: describeListing({ type, purpose, ...size, furnished, amenities, neighbourhoodName: nb.name }),
      purpose,
      type,
      status,
      price,
      ...size,
      furnished,
      petsAllowed: type === "plot" || type === "commercial" ? false : r.bool(0.4),
      parking: type === "plot" ? 0 : type === "villa" ? r.int(3, 5) : type === "commercial" ? r.int(2, 10) : r.int(1, 3),
      amenities,
      images: imagesFor(type, i, r, nb),
      floorPlan: null,
      videoUrl: null,
      address: address(nb, r, type === "plot"),
      neighbourhoodId: nb.id,
      location: { lat: nb.center.lat + r.float(-0.009, 0.009), lng: nb.center.lng + r.float(-0.011, 0.011) },
      yearBuilt: type === "plot" ? null : r.int(nb.slug === "model-town" ? 1985 : 2005, 2026),
      listedBy: agent ? "agent" : "owner",
      ownerId,
      agentId: agent?.id ?? null,
      agencyId: agent?.agencyId ?? null,
      verified: agent ? r.bool(0.85) : r.bool(0.45),
      views,
      saves: Math.round(views * r.float(0.02, 0.07)),
      enquiries: Math.round(views * r.float(0.006, 0.02)),
      priceHistory: priceHistory(price, createdAt, r, purpose),
      depositMonths: purpose === "rent" ? (type === "commercial" ? 3 : 2) : null,
      advanceMonths: purpose === "rent" ? (type === "commercial" ? 3 : r.int(1, 2)) : null,
      createdAt,
      updatedAt: createdAt,
    };
  });
}
