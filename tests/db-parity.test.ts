import { config } from "dotenv";
import { afterAll, describe, expect, it } from "vitest";
import type { SearchFilters } from "@/lib/data/types";

config({ path: ".env.local", quiet: true });
const hasDb = !!process.env.DATABASE_URL?.trim();

/**
 * The Neon repository must answer exactly like the in-memory one, whose filter logic is the reference.
 * Runs only when DATABASE_URL is set; assumes a freshly seeded database (`npm run db:seed`).
 */
describe.skipIf(!hasDb)("Neon repository parity with mock", async () => {
  const dbRepo = hasDb ? await import("@/lib/data/db/repos/listings") : null;
  const mockRepo = await import("@/lib/data/mock/repos/listings");
  const dbEng = hasDb ? await import("@/lib/data/db/repos/engagement") : null;
  const dbMsg = hasDb ? await import("@/lib/data/db/repos/messaging") : null;
  const created: { collection?: string; notificationUser?: string } = {};

  const cases: [string, SearchFilters][] = [
    ["everything", {}],
    ["rent in Gulberg", { purpose: "rent", neighbourhoodIds: ["nb-gulberg"] }],
    ["3+ bed houses under 10 Cr", { purpose: "sale", types: ["house"], minBeds: 3, maxPrice: 100_000_000 }],
    ["amenities + verified", { amenities: ["security"], verifiedOnly: true }],
    ["keyword", { q: "corner" }],
    ["polygon", { polygon: [[31.49, 74.44], [31.49, 74.47], [31.47, 74.47], [31.47, 74.44]] }],
    ["price ascending", { purpose: "sale", sort: "price_asc" }],
    ["price per area", { sort: "price_per_area" }],
  ];

  for (const [name, filters] of cases) {
    it(`search: ${name}`, async () => {
      const [a, b] = await Promise.all([dbRepo!.listings.search(filters, 1, 100), mockRepo.listings.search(filters, 1, 100)]);
      expect(a.total).toBe(b.total);
      const ids = (x: typeof a) => x.items.map((l) => l.id);
      // Sorted queries must agree on order; unsorted ones on membership.
      if (filters.sort) expect(ids(a)).toEqual(ids(b));
      else expect(new Set(ids(a))).toEqual(new Set(ids(b)));
    });
  }

  it("paginates with a correct total", async () => {
    const page2 = await dbRepo!.listings.search({ sort: "price_desc" }, 2, 10);
    const ref = await mockRepo.listings.search({ sort: "price_desc" }, 2, 10);
    expect(page2.total).toBe(ref.total);
    expect(page2.items.map((l) => l.id)).toEqual(ref.items.map((l) => l.id));
  });

  it("maps a listing back to the domain shape", async () => {
    const [a, b] = await Promise.all([dbRepo!.listings.findById("l-1"), mockRepo.listings.findById("l-1")]);
    expect(a).toMatchObject({ id: "l-1", title: b!.title, price: b!.price, location: b!.location, amenities: b!.amenities, images: b!.images });
    expect(typeof a!.createdAt).toBe("string");
  });

  it("round-trips writes (cleaned up afterwards)", async () => {
    const c = await dbEng!.collections.create("u-seeker", "Parity test");
    created.collection = c.id;
    await dbEng!.collections.setMembership(c.id, "l-2", true);
    expect((await dbEng!.collections.forUser("u-seeker")).find((x) => x.id === c.id)!.listingIds).toEqual(["l-2"]);

    const before = await dbMsg!.notifications.unreadCount("u-seeker-4");
    await dbMsg!.notifications.create({ userId: "u-seeker-4", type: "system", title: "Parity", body: "", href: null });
    created.notificationUser = "u-seeker-4";
    expect(await dbMsg!.notifications.unreadCount("u-seeker-4")).toBe(before + 1);
  });

  afterAll(async () => {
    if (created.collection) await dbEng!.collections.remove(created.collection);
    if (created.notificationUser) await dbMsg!.notifications.markRead(created.notificationUser, "all");
  });
});
