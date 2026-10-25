import { NextResponse } from "next/server";
import { repo } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth/session";

export type InboxItem = {
  id: string;
  listing: { id: string; title: string; image: string | null } | null;
  others: { id: string; name: string; avatar: string | null }[];
  last: { body: string; createdAt: string; mine: boolean } | null;
  unread: number;
};

/** The signed-in user's conversations, newest first, with unread counts. Polled by the inbox. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await repo.conversations.forUser(user.id);
  const people = await repo.users.findManyByIds([...new Set(conversations.flatMap((c) => c.participantIds))]);
  const listings = await repo.listings.findManyByIds(conversations.map((c) => c.listingId).filter((x): x is string => !!x));

  const items: InboxItem[] = await Promise.all(conversations.map(async (c) => {
    const messages = await repo.conversations.messages(c.id);
    const last = messages.at(-1);
    const listing = listings.find((l) => l.id === c.listingId);
    return {
      id: c.id,
      listing: listing ? { id: listing.id, title: listing.title, image: listing.images[0] ?? null } : null,
      others: people.filter((p) => p.id !== user.id && c.participantIds.includes(p.id)).map((p) => ({ id: p.id, name: p.name, avatar: p.avatar })),
      last: last ? { body: last.body, createdAt: last.createdAt, mine: last.senderId === user.id } : null,
      unread: messages.filter((m) => !m.readBy.includes(user.id)).length,
    };
  }));
  return NextResponse.json(items);
}
