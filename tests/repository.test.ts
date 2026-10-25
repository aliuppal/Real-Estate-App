import { describe, expect, it } from "vitest";
import { listings } from "@/lib/data/mock/repos/listings";
import { collections, savedSearches } from "@/lib/data/mock/repos/engagement";
import { conversations, notifications } from "@/lib/data/mock/repos/messaging";
import { leads } from "@/lib/data/mock/repos/crm";

describe("mock repository mutations", () => {
  it("creates a listing and records price changes in its history", async () => {
    const base = (await listings.findById("l-1"))!;
    const created = await listings.create({ ...base, title: "Test home in DHA", status: "active", price: 50_000_000 });
    expect(created.slug).toMatch(/^test-home-in-dha/);
    expect(created.priceHistory).toHaveLength(1);

    await listings.update(created.id, { price: 45_000_000 });
    const updated = (await listings.findById(created.id))!;
    expect(updated.priceHistory.map((p) => p.price)).toEqual([50_000_000, 45_000_000]);
  });

  it("finds saved-search alerts a new listing matches", async () => {
    const listing = (await listings.findById("l-1"))!;
    const search = await savedSearches.create({ userId: "u-seeker", name: "t", alertsEnabled: true, filters: { purpose: listing.purpose, neighbourhoodIds: [listing.neighbourhoodId] } });
    expect((await savedSearches.matchingAlerts(listing)).map((s) => s.id)).toContain(search.id);
    await savedSearches.update(search.id, { alertsEnabled: false });
    expect((await savedSearches.matchingAlerts(listing)).map((s) => s.id)).not.toContain(search.id);
  });

  it("toggles collection membership idempotently", async () => {
    const c = await collections.create("u-seeker", "Test");
    await collections.setMembership(c.id, "l-2", true);
    await collections.setMembership(c.id, "l-2", true);
    expect((await collections.forUser("u-seeker")).find((x) => x.id === c.id)!.listingIds).toEqual(["l-2"]);
    await collections.setMembership(c.id, "l-2", false);
    expect((await collections.forUser("u-seeker")).find((x) => x.id === c.id)!.listingIds).toEqual([]);
  });

  it("reuses an existing conversation and tracks unread messages", async () => {
    const a = await conversations.findOrStart("l-3", ["u-seeker-4", "u-owner"]);
    const b = await conversations.findOrStart("l-3", ["u-owner", "u-seeker-4"]);
    expect(b.id).toBe(a.id);
    const before = await conversations.unreadCount("u-owner");
    await conversations.send(a.id, "u-seeker-4", "Hello");
    expect(await conversations.unreadCount("u-owner")).toBe(before + 1);
    await conversations.markRead(a.id, "u-owner");
    expect(await conversations.unreadCount("u-owner")).toBe(before);
  });

  it("marks notifications read", async () => {
    await notifications.create({ userId: "u-seeker-3", type: "system", title: "Hi", body: "", href: null });
    expect(await notifications.unreadCount("u-seeker-3")).toBeGreaterThan(0);
    await notifications.markRead("u-seeker-3", "all");
    expect(await notifications.unreadCount("u-seeker-3")).toBe(0);
  });

  it("moves leads between stages and keeps notes newest-first", async () => {
    const lead = (await leads.forAgent("a-1"))[0];
    await leads.update(lead.id, { stage: "offer" });
    await leads.addNote(lead.id, "first");
    await leads.addNote(lead.id, "second");
    const after = (await leads.findById(lead.id))!;
    expect(after.stage).toBe("offer");
    expect(after.notes.slice(0, 2).map((n) => n.body)).toEqual(["second", "first"]);
  });
});
