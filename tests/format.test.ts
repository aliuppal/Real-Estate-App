import { describe, expect, it } from "vitest";
import { formatArea, formatPrice, plotSizeLabel, toSqft } from "@/lib/format";
import { estimateMortgage, monthlyPayment } from "@/lib/mortgage";

describe("formatPrice", () => {
  it("uses lakh / crore for compact PKR", () => {
    expect(formatPrice(24_500_000, { compact: true })).toBe("Rs 2.45 Crore");
    expect(formatPrice(150_000, { compact: true, purpose: "rent" })).toBe("Rs 1.5 Lakh/mo");
  });

  it("converts to USD at the configured rate", () => {
    expect(formatPrice(28_000_000, { currency: "USD", compact: true })).toBe("$100K");
  });
});

describe("areas", () => {
  it("follows the Lahore marla/kanal convention", () => {
    expect(plotSizeLabel(2250)).toBe("10 Marla");
    expect(plotSizeLabel(4500)).toBe("1 Kanal");
    expect(toSqft(1, "kanal")).toBe(4500);
    expect(formatArea(2250, "marla")).toBe("10 marla");
  });
});

describe("mortgage", () => {
  it("matches the standard amortisation formula", () => {
    // 1,000,000 at 12% over 1 year ≈ 88,849 per month.
    expect(Math.round(monthlyPayment(1_000_000, 12, 1))).toBe(88_849);
    expect(monthlyPayment(1_200_000, 0, 1)).toBe(100_000);
  });

  it("derives loan and income needed from the down payment", () => {
    const e = estimateMortgage(10_000_000, 30, 0, 10);
    expect(e.loan).toBe(7_000_000);
    expect(e.incomeNeeded).toBeCloseTo(e.monthly / 0.4);
  });
});
