"use server";

import { revalidatePath } from "next/cache";
import { repo, type Listing, type PublicUser } from "@/lib/data";
import { ActionError, actionUser, runAction } from "@/lib/auth/action";
import { listingContact, notify, upsertLead } from "@/lib/notify";
import { bookedFor } from "@/lib/viewings";
import { formatInLahore, viewingSlots } from "@/lib/availability";
import { formatPrice } from "@/lib/format";
import { callbackSchema, enquirySchema, offerSchema, viewingRequestSchema } from "@/lib/validation/listing";

async function contactable(user: PublicUser, listingId: string) {
  const listing = await repo.listings.findById(listingId);
  if (!listing || (listing.status !== "active" && listing.status !== "under_offer")) throw new ActionError("This listing isn't available any more.");
  const contact = await listingContact(listing);
  if (!contact) throw new ActionError("There's no one to contact about this listing yet.");
  if (contact.userId === user.id) throw new ActionError("This is your own listing.");
  return { listing, contact };
}

async function thread(user: PublicUser, listing: Listing, contactUserId: string, body: string) {
  const conversation = await repo.conversations.findOrStart(listing.id, [user.id, contactUserId]);
  await repo.conversations.send(conversation.id, user.id, body);
  return conversation;
}

export async function sendEnquiry(input: { listingId: string; body: string }) {
  return runAction(async () => {
    const user = await actionUser();
    const { listingId, body } = enquirySchema.parse(input);
    const { listing, contact } = await contactable(user, listingId);
    const conversation = await thread(user, listing, contact.userId, body);
    await repo.listings.adjustCounter(listing.id, "enquiries", 1);
    if (contact.agentId) await upsertLead(contact.agentId, user, listing, "listing_enquiry", "new");
    await notify([contact.userId], { type: "message", title: `New enquiry from ${user.name}`, body: listing.title, href: `/dashboard/messages?c=${conversation.id}` });
    revalidatePath("/dashboard/messages");
    return { conversationId: conversation.id };
  });
}

export async function requestViewing(input: { listingId: string; start: string; note: string | null }) {
  return runAction(async () => {
    const user = await actionUser();
    const { listingId, start, note } = viewingRequestSchema.parse(input);
    const { listing, contact } = await contactable(user, listingId);
    // Only accept slots we'd actually offer; the client's list could be stale or tampered with.
    const wanted = new Date(start).toISOString();
    const slot = viewingSlots(await bookedFor(listing), 14).flatMap((d) => d.slots).find((s) => s.start === wanted);
    if (!slot?.available) throw new ActionError("That time was just taken. Please pick another slot.");

    const viewing = await repo.viewings.create({ listingId, seekerId: user.id, agentId: listing.agentId, start: slot.start, end: slot.end, note });
    if (contact.agentId) await upsertLead(contact.agentId, user, listing, "listing_enquiry", "viewing");
    const when = formatInLahore(slot.start, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
    await notify([contact.userId], {
      type: "viewing", title: `Viewing request: ${when}`, body: `${user.name} · ${listing.title}`,
      href: listing.agentId ? "/dashboard/agent/calendar" : "/dashboard/owner/viewings",
    });
    revalidatePath("/dashboard", "layout");
    return viewing;
  });
}

const WHEN_LABEL = { morning: "in the morning", afternoon: "in the afternoon", evening: "in the evening" } as const;

export async function requestCallback(input: { listingId: string; phone: string; when: "morning" | "afternoon" | "evening" }) {
  return runAction(async () => {
    const user = await actionUser();
    const { listingId, phone, when } = callbackSchema.parse(input);
    const { listing, contact } = await contactable(user, listingId);
    const conversation = await thread(user, listing, contact.userId, `Please call me back on ${phone}, ideally ${WHEN_LABEL[when]}.`);
    if (contact.agentId) await upsertLead(contact.agentId, { ...user, phone }, listing, "call_back", "new");
    await notify([contact.userId], { type: "lead", title: `Call-back request from ${user.name}`, body: `${phone} · ${WHEN_LABEL[when]}`, href: `/dashboard/messages?c=${conversation.id}` });
  });
}

export async function makeOffer(input: { listingId: string; amount: number; message: string | null }) {
  return runAction(async () => {
    const user = await actionUser(["seeker"]);
    const { listingId, amount, message } = offerSchema.parse(input);
    const { listing, contact } = await contactable(user, listingId);
    const kind = listing.purpose === "sale" ? "offer" : "application";
    const open = (await repo.offers.forSeeker(user.id)).some((o) => o.listingId === listingId && (o.status === "submitted" || o.status === "reviewing"));
    if (open) throw new ActionError(`You already have an open ${kind} on this home.`);

    const offer = await repo.offers.create({ listingId, seekerId: user.id, kind, amount, message });
    if (contact.agentId) await upsertLead(contact.agentId, user, listing, "listing_enquiry", "offer");
    await notify([contact.userId], {
      type: "offer",
      title: kind === "offer" ? `Offer of ${formatPrice(amount, { compact: true })}` : "New rental application",
      body: `${user.name} · ${listing.title}`,
      href: listing.agentId ? "/dashboard/agent/leads" : "/dashboard/owner/offers",
    });
    revalidatePath("/dashboard", "layout");
    return offer;
  });
}
