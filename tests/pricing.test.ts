import { describe, expect, it } from "vitest";
import { buildSeed } from "@/lib/data/mock/seed";
import { suggestPrice, TYPE_FACTOR, vsNeighbourhood } from "@/lib/pricing";
import { viewingSlots } from "@/lib/availability";
import type { Listing } from "@/lib/data/types";

const { neighbourhoods, listings } = buildSeed();
const gulberg = neighbourhoods.find((n) => n.slug === "gulberg")!;

const comp = (price: number, areaSqft: number): Listing =>
  ({ ...listings[0], id: `c${price}`, type: "apartment", purpose: "sale", neighbourhoodId: gulberg.id, price, areaSqft }) as Listing;

describe("suggestPrice", () => {
  it("uses the median price per sq ft of nearby comparables", () => {
    const comps = [comp(20e6, 1000), comp(30e6, 1000), comp(25e6, 1000), comp(99e6, 1000)];
    const s = suggestPrice({ type: "apartment", purpose: "sale", areaSqft: 2000, neighbourhoodId: gulberg.id }, comps, gulberg);
    expect(s.basis).toEqual({ kind: "comparables", count: 4 });
    expect(s.perSqft).toBe(27_500);
    expect(s.mid).toBe(55_000_000);
    expect(s.low).toBeLessThan(s.mid);
    expect(s.high).toBeGreaterThan(s.mid);
  });

  it("falls back to the neighbourhood rate when there are too few comparables", () => {
    const s = suggestPrice({ type: "villa", purpose: "rent", areaSqft: 1000, neighbourhoodId: gulberg.id }, [], gulberg);
    expect(s.basis.kind).toBe("neighbourhood");
    expect(s.perSqft).toBe(Math.round(gulberg.avgRentPerSqft * TYPE_FACTOR.villa));
    expect(s.mid % 5_000).toBe(0);
  });

  it("compares a listing's rate with its neighbourhood", () => {
    const v = vsNeighbourhood({ price: gulberg.avgSalePerSqft * 1000 * 2, areaSqft: 1000, purpose: "sale", type: "house" }, gulberg);
    expect(v.ratio).toBeCloseTo(2);
  });
});

describe("viewingSlots", () => {
  it("offers Monday–Saturday hourly slots and blocks booked ones", () => {
    // A Wednesday morning in Lahore.
    const now = new Date("2026-10-21T04:00:00Z");
    const first = viewingSlots([], 7, now)[0];
    expect(first.date).toBe("2026-10-22");
    expect(first.slots).toHaveLength(8);
    expect(first.slots[0].start).toBe("2026-10-22T05:00:00.000Z"); // 10:00 in Lahore

    const booked = [{ start: first.slots[2].start, end: first.slots[2].end, status: "confirmed" as const }];
    const again = viewingSlots(booked, 7, now)[0];
    expect(again.slots[2].available).toBe(false);
    expect(again.slots[3].available).toBe(true);
    expect(viewingSlots([], 7, now).some((d) => new Date(`${d.date}T12:00:00+05:00`).getUTCDay() === 0)).toBe(false);
  });
});
