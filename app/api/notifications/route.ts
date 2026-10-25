import { NextResponse } from "next/server";
import { repo } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth/session";

/** Unread counts for the bell and sidebar badges, plus the latest notifications. Polled. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [items, unread, unreadMessages] = await Promise.all([
    repo.notifications.forUser(user.id),
    repo.notifications.unreadCount(user.id),
    repo.conversations.unreadCount(user.id),
  ]);
  return NextResponse.json({ unread, unreadMessages, items: items.slice(0, 20) });
}
