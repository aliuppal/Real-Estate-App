import type {
  Agency, Agent, Collection, Conversation, Lead, LeadStage, Listing, Message, Notification,
  Offer, Report, Review, SavedSearch, Viewing,
} from "../../types";
import { createRandom, daysAgo, daysFromNow } from "./random";

const REVIEWERS = [
  "Faisal K.", "Amna R.", "Shoaib M.", "Mehwish T.", "Adnan S.", "Rida F.", "Waqas A.", "Iqra N.",
  "Talha B.", "Hina J.", "Zubair Q.", "Areeba L.", "Naveed H.", "Saima D.", "Umer G.", "Kiran P.",
];

const AGENT_COMMENTS = [
  "Answered every question within the hour and never pushed us towards a house we didn't love.",
  "Knew the society rules inside out. Transfer at the DHA office took one visit instead of five.",
  "Honest about the damp in the basement before we even asked. That's why we trusted the rest.",
  "Found us a rental two days before our lease ran out. Calm, organised, and very responsive.",
  "Good negotiator. We paid noticeably less than the asking price.",
  "Helpful, though viewings were sometimes rescheduled at short notice.",
  "Handled everything for us while we were abroad, with video walkthroughs of every room.",
  "Great local knowledge: which streets flood, which have the best schools nearby.",
];

const AGENCY_COMMENTS = [
  "Professional team. Paperwork was ready on time and the office kept us updated.",
  "Several agents worked on our search together, which made it much faster.",
  "Clear fees, no surprises at the end.",
  "Smaller listings get less attention, but the senior agents are excellent.",
  "Sold our home in under a month at a fair price.",
];

export function buildReviews(agents: Agent[], agencies: Agency[]): Review[] {
  const r = createRandom(7);
  const rating = () => (r.bool(0.7) ? 5 : r.bool(0.75) ? 4 : 3);
  const reviews: Review[] = [];
  const add = (targetType: Review["targetType"], targetId: string, comments: string[]) =>
    reviews.push({ id: `rv-${reviews.length + 1}`, targetType, targetId, authorId: null, authorName: r.pick(REVIEWERS),
      rating: rating(), comment: r.pick(comments), createdAt: daysAgo(r.int(3, 300)) });

  for (const a of agents) {
    const count = a.verification === "pending" ? 1 : r.int(3, 6);
    for (let i = 0; i < count; i++) add("agent", a.id, AGENT_COMMENTS);
  }
  for (const ag of agencies) {
    const count = ag.verification === "pending" ? 1 : r.int(3, 5);
    for (let i = 0; i < count; i++) add("agency", ag.id, AGENCY_COMMENTS);
  }
  return reviews;
}

const LEAD_PEOPLE: [string, string | null][] = [
  ["Haris Mehmood", "u-seeker-2"], ["Komal Zafar", "u-seeker-3"], ["Junaid Akhtar", "u-seeker-4"],
  ["Ayesha Malik", "u-seeker"], ["Tariq Jamil", null], ["Nimra Asif", null], ["Hassan Ali", null],
  ["Fiza Kanwal", null], ["Ahsan Iqbal", null], ["Mariam Saleem", null], ["Shahid Nawaz", null], ["Laiba Khan", null],
];

const LEAD_STAGE_PLAN: LeadStage[] = [
  "new", "new", "new", "contacted", "contacted", "viewing", "viewing", "offer", "offer", "closed", "lost", "contacted",
];

export function buildActivity(listings: Listing[], agents: Agent[]) {
  const r = createRandom(99);
  const active = listings.filter((l) => l.status === "active");
  const byAgent = (id: string) => active.filter((l) => l.agentId === id);
  const a1Listings = byAgent("a-1").length ? byAgent("a-1") : active.filter((l) => l.listedBy === "agent");
  const ownerListing = active.find((l) => l.ownerId === "u-owner" && l.listedBy === "owner")!;
  const rentListing = active.find((l) => l.purpose === "rent" && l.agentId && l.agentId !== "a-1")!;
  const saleListing = a1Listings.find((l) => l.purpose === "sale") ?? a1Listings[0];
  const second = a1Listings[1] ?? saleListing;
  const third = a1Listings[2] ?? saleListing;
  const agentUser = (agentId: string) => agents.find((a) => a.id === agentId)!.userId;

  const savedSearches: SavedSearch[] = [
    { id: "ss-1", userId: "u-seeker", name: "Family homes in DHA under 10 crore", alertsEnabled: true,
      filters: { purpose: "sale", types: ["house"], neighbourhoodIds: ["nb-dha-phase-6"], minBeds: 3, maxPrice: 100_000_000 },
      lastCheckedAt: daysAgo(4), createdAt: daysAgo(40) },
    { id: "ss-2", userId: "u-seeker", name: "Furnished rentals in Gulberg", alertsEnabled: true,
      filters: { purpose: "rent", neighbourhoodIds: ["nb-gulberg"], furnished: true }, lastCheckedAt: daysAgo(2), createdAt: daysAgo(21) },
    { id: "ss-3", userId: "u-seeker", name: "Plots in Bahria Town", alertsEnabled: false,
      filters: { purpose: "sale", types: ["plot"], neighbourhoodIds: ["nb-bahria-town"] }, lastCheckedAt: daysAgo(10), createdAt: daysAgo(60) },
  ];

  const collections: Collection[] = [
    { id: "col-1", userId: "u-seeker", name: "Shortlist", listingIds: r.sample(active, 5).map((l) => l.id), createdAt: daysAgo(30) },
    { id: "col-2", userId: "u-seeker", name: "For mom to see", listingIds: r.sample(active, 3).map((l) => l.id), createdAt: daysAgo(12) },
  ];

  const conversations: Conversation[] = [];
  const messages: Message[] = [];
  /** Lines are [speakerIndex, body]; messages are spread evenly from `startDaysAgo` towards now. */
  const thread = (listing: Listing, a: string, b: string, lines: [0 | 1, string][], startDaysAgo: number) => {
    const id = `cv-${conversations.length + 1}`;
    const people = [a, b];
    lines.forEach(([who, body], i) => {
      const last = i === lines.length - 1;
      // The final message stays unread by its recipient, so inboxes show an unread badge.
      messages.push({ id: `m-${messages.length + 1}`, conversationId: id, senderId: people[who], body,
        readBy: last ? [people[who]] : people, createdAt: daysAgo(startDaysAgo * (1 - i / lines.length)) });
    });
    conversations.push({ id, listingId: listing.id, participantIds: people,
      lastMessageAt: messages[messages.length - 1].createdAt, createdAt: daysAgo(startDaysAgo) });
  };

  thread(saleListing, "u-seeker", "u-agent", [
    [0, "Hi Hamza, is this house still available? We'd like to see it this weekend."],
    [1, "Hi Ayesha, yes it is. Saturday at 11 or Sunday at 4 both work on my side."],
    [0, "Saturday at 11 is perfect. Is the asking price negotiable?"],
    [1, "There's some room. The owner is motivated, so let's talk after the viewing."],
  ], 3);
  thread(ownerListing, "u-seeker", "u-owner", [
    [0, "Assalam o Alaikum, could you share the average electricity bill for the summer months?"],
    [1, "Walaikum Assalam. Around Rs 38,000 in July with two ACs running. Solar covers the daytime."],
  ], 6);
  thread(rentListing, "u-seeker", agentUser(rentListing.agentId!), [
    [0, "Are pets allowed? We have a small cat."],
    [1, "The landlord is fine with a cat as long as the security deposit covers any damage."],
    [0, "Great, thank you. Can we see it on Thursday evening?"],
  ], 9);
  thread(second, "u-seeker-2", "u-agent", [
    [0, "Is the price final? We're cash buyers and can close quickly."],
    [1, "Let me check with the owner and get back to you today."],
  ], 1.5);
  thread(third, "u-seeker-3", "u-agent", [
    [0, "Could you send a few more photos of the kitchen and the rooftop?"],
  ], 0.5);

  const HALF_HOUR = 1 / 48;
  const viewing = (id: number, listing: Listing, seekerId: string, agentId: string | null, inDays: number,
    status: Viewing["status"], note: string | null = null): Viewing => ({
    id: `v-${id}`, listingId: listing.id, seekerId, agentId, status, note, createdAt: daysAgo(Math.max(1, -inDays + 3)),
    start: inDays >= 0 ? daysFromNow(inDays) : daysAgo(-inDays),
    end: inDays >= 0 ? daysFromNow(inDays + HALF_HOUR) : daysAgo(-inDays - HALF_HOUR),
  });
  const viewings: Viewing[] = [
    viewing(1, saleListing, "u-seeker", "a-1", 2, "confirmed", "Bring the floor plan."),
    viewing(2, rentListing, "u-seeker", rentListing.agentId, 4, "requested"),
    viewing(3, ownerListing, "u-seeker", null, 6, "confirmed"),
    viewing(4, second, "u-seeker", "a-1", -8, "completed"),
    viewing(5, third, "u-seeker-2", "a-1", 1, "confirmed"),
  ];

  const leads: Lead[] = LEAD_PEOPLE.map(([name, seekerId], i): Lead => {
    const listing = a1Listings[i % a1Listings.length];
    const created = daysAgo(1 + i * 3);
    return {
      id: `ld-${i + 1}`, agentId: "a-1", seekerId, listingId: listing.id, name,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`, phone: `+92 30${i % 10} 555 01${String(i).padStart(2, "0")}`,
      stage: LEAD_STAGE_PLAN[i], source: (["listing_enquiry", "match_quiz", "call_back", "referral"] as const)[i % 4],
      budget: listing.purpose === "sale" ? Math.round(listing.price * 0.95) : listing.price,
      notes: i % 3 === 0 ? [{ id: `ln-${i + 1}`, body: "Prefers a corner house. Wants to move in before school starts.", createdAt: created }] : [],
      createdAt: created, updatedAt: daysAgo(i),
    };
  });
  const teamLeadNames = ["Rizwan Ahmed", "Sadia Ahmed", "Nabeel Ahmed", "Hafsa Ahmed", "Owais Ahmed", "Mahira Ahmed"];
  for (const agentId of ["a-2", "a-3"]) {
    (["new", "viewing", "closed"] as LeadStage[]).forEach((stage, i) => {
      const n = leads.length + 1;
      leads.push({ id: `ld-${n}`, agentId, seekerId: null, listingId: byAgent(agentId)[i]?.id ?? null,
        name: teamLeadNames[n % teamLeadNames.length], email: `lead${n}@example.com`, phone: null, stage,
        source: "listing_enquiry", budget: null, notes: [], createdAt: daysAgo(5 + i * 4), updatedAt: daysAgo(2 + i) });
    });
  }

  const offers: Offer[] = [
    { id: "of-1", listingId: saleListing.id, seekerId: "u-seeker", kind: "offer", amount: Math.round(saleListing.price * 0.93),
      message: "We can pay a 20% token immediately.", status: "reviewing", createdAt: daysAgo(2), updatedAt: daysAgo(1) },
    { id: "of-2", listingId: rentListing.id, seekerId: "u-seeker", kind: "application", amount: rentListing.price,
      message: "Family of four, both working, references available.", status: "submitted", createdAt: daysAgo(1), updatedAt: daysAgo(1) },
    { id: "of-3", listingId: second.id, seekerId: "u-seeker", kind: "offer", amount: Math.round(second.price * 0.85),
      message: null, status: "rejected", createdAt: daysAgo(14), updatedAt: daysAgo(11) },
  ];

  const note = (id: number, userId: string, type: Notification["type"], title: string, body: string,
    href: string | null, read: boolean, days: number): Notification =>
    ({ id: `nt-${id}`, userId, type, title, body, href, read, createdAt: daysAgo(days) });
  const notifications: Notification[] = [
    note(1, "u-seeker", "saved_search_match", "New homes match “Family homes in DHA”", "New listings appeared in DHA Phase 6 this week.", "/search?purpose=sale&types=house", false, 0.3),
    note(2, "u-seeker", "viewing", "Viewing confirmed", "Hamza Qureshi confirmed your viewing for this weekend.", "/dashboard/seeker/viewings", false, 1),
    note(3, "u-seeker", "offer", "Your offer is being reviewed", "The seller is reviewing your offer.", "/dashboard/seeker/offers", true, 1.5),
    note(4, "u-agent", "lead", "New lead from the match quiz", "Komal Zafar matched with you for a 10 Marla home.", "/dashboard/agent/leads", false, 0.4),
    note(5, "u-agent", "message", "New message from Komal Zafar", "Could you send a few more photos of the kitchen…", "/dashboard/messages", false, 0.5),
    note(6, "u-owner", "message", "New enquiry on your listing", "Ayesha Malik asked about electricity costs.", "/dashboard/messages", false, 2),
    note(7, "u-agency", "lead", "3 leads are unassigned", "Assign them to keep response times low.", "/dashboard/agency/team", false, 1),
    note(8, "u-admin", "verification", "Verification queue", "Heritage Lane Realtors and its agents are awaiting review.", "/dashboard/admin/verification", false, 0.8),
  ];

  const reports: Report[] = [
    { id: "rp-1", listingId: active[5].id, reporterId: "u-seeker-2", reason: "Photos don't match the property.", status: "open", createdAt: daysAgo(2) },
    { id: "rp-2", listingId: active[17].id, reporterId: null, reason: "The listed price looks like a bait price.", status: "open", createdAt: daysAgo(4) },
    { id: "rp-3", listingId: active[30].id, reporterId: "u-seeker-3", reason: "Already sold but still showing as available.", status: "resolved", createdAt: daysAgo(20) },
  ];

  return { savedSearches, collections, conversations, messages, viewings, leads, offers, notifications, reports };
}
