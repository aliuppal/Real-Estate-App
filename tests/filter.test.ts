import { describe, expect, it } from "vitest";
import { buildSeed } from "@/lib/data/mock/seed";
import { matchesFilters, pointInPolygon, priceDrop, sortListings } from "@/lib/search/filter";
import { filtersToSearchParams, searchParamsToFilters } from "@/lib/search/params";
import type { SearchFilters } from "@/lib/data/types";

const { listings } = buildSeed();

describe("seed data", () => {
  it("has 60+ listings spread over rent and sale and every type", () => {
    expect(listings.length).toBeGreaterThanOrEqual(60);
    expect(new Set(listings.map((l) => l.purpose))).toEqual(new Set(["rent", "sale"]));
    expect(new Set(listings.map((l) => l.type)).size).toBe(5);
  });

  it("is deterministic apart from dates", () => {
    const again = buildSeed().listings;
    expect(again.map((l) => [l.id, l.title, l.price])).toEqual(listings.map((l) => [l.id, l.title, l.price]));
  });
});

describe("matchesFilters", () => {
  it("combines purpose, type, price and beds", () => {
    const f: SearchFilters = { purpose: "sale", types: ["house"], maxPrice: 1e8, minBeds: 3 };
    const hits = listings.filter((l) => matchesFilters(l, f));
    expect(hits.length).toBeGreaterThan(0);
    for (const l of hits) {
      expect(l.purpose).toBe("sale");
      expect(l.type).toBe("house");
      expect(l.price).toBeLessThanOrEqual(1e8);
      expect(l.beds).toBeGreaterThanOrEqual(3);
    }
  });

  it("requires every requested amenity", () => {
    const hits = listings.filter((l) => matchesFilters(l, { amenities: ["garden", "security"] }));
    for (const l of hits) expect(l.amenities).toEqual(expect.arrayContaining(["garden", "security"]));
  });

  it("filters by a drawn polygon", () => {
    const l = listings[0];
    const d = 0.001;
    const square: [number, number][] = [
      [l.location.lat - d, l.location.lng - d], [l.location.lat - d, l.location.lng + d],
      [l.location.lat + d, l.location.lng + d], [l.location.lat + d, l.location.lng - d],
    ];
    expect(matchesFilters(l, { polygon: square })).toBe(true);
    expect(pointInPolygon(l.location.lat + 1, l.location.lng, square)).toBe(false);
  });
});

describe("sorting and badges", () => {
  it("sorts by price ascending", () => {
    const prices = sortListings(listings, "price_asc").map((l) => l.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("detects a price drop only when the latest price is lower than the first", () => {
    expect(priceDrop({ priceHistory: [{ date: "", price: 100 }, { date: "", price: 90 }] })).toBe(10);
    expect(priceDrop({ priceHistory: [{ date: "", price: 90 }, { date: "", price: 100 }] })).toBeNull();
  });
});

describe("URL round trip", () => {
  it("survives serialise → parse", () => {
    const f: SearchFilters = {
      purpose: "rent", types: ["apartment", "house"], neighbourhoodIds: ["nb-gulberg"], maxPrice: 150000,
      minBeds: 2, furnished: true, amenities: ["lift"], sort: "price_asc",
      polygon: [[31.5, 74.3], [31.51, 74.31], [31.5, 74.32]],
    };
    expect(searchParamsToFilters(filtersToSearchParams(f))).toMatchObject(f);
  });

  it("drops values it doesn't recognise", () => {
    const f = searchParamsToFilters(new URLSearchParams("purpose=lease&types=castle,villa&sort=random&minBeds=abc"));
    expect(f.purpose).toBeUndefined();
    expect(f.types).toEqual(["villa"]);
    expect(f.sort).toBeUndefined();
    expect(f.minBeds).toBeUndefined();
  });
});
