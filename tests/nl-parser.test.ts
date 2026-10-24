import { describe, expect, it } from "vitest";
import { parseQuery } from "@/lib/search/nl-parser";

describe("plain-English search parser", () => {
  it("handles the brief's example", () => {
    const { filters } = parseQuery("3 bed house near a school under 150k with a garden");
    expect(filters).toMatchObject({ minBeds: 3, types: ["house"], maxPrice: 150_000 });
    expect(filters.amenities).toEqual(expect.arrayContaining(["near_school", "garden"]));
  });

  it("understands rentals, local units and neighbourhoods", () => {
    const { filters } = parseQuery("furnished two bedroom flat to rent in Gulberg under 1.5 lakh, pets ok");
    expect(filters).toMatchObject({
      purpose: "rent", minBeds: 2, types: ["apartment"], maxPrice: 150_000,
      neighbourhoodIds: ["nb-gulberg"], furnished: true, petsAllowed: true,
    });
  });

  it("parses price ranges, carrying the unit to a bare lower bound", () => {
    const { filters } = parseQuery("10 marla corner plot in bahria between 1 and 2 crore");
    expect(filters).toMatchObject({ types: ["plot"], minPrice: 1e7, maxPrice: 2e7, minAreaSqft: 2250, neighbourhoodIds: ["nb-bahria-town"] });
    expect(filters.amenities).toContain("corner");
  });

  it("doesn't treat 'unfurnished' as furnished or 'homes' as houses", () => {
    const { filters } = parseQuery("unfurnished homes in DHA");
    expect(filters.furnished).toBeUndefined();
    expect(filters.types).toBeUndefined();
    expect(filters.neighbourhoodIds).toEqual(["nb-dha-phase-6"]);
  });

  it("returns readable chips in input order", () => {
    expect(parseQuery("villa with pool over 10 cr").understood).toEqual(["Villa", "Over 10 Cr", "Pool"]);
  });

  it("returns empty filters for unrelated text", () => {
    expect(parseQuery("hello there").filters).toEqual({});
  });
});
