import { NextResponse } from "next/server";
import { repo } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth/session";

export type ThreadMessage = { id: string; body: string; createdAt: string; senderId: string; mine: boolean; readByOthers: boolean };

/** One thread's messages. Members only; reading doesn't mark as read (the client does that explicitly). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const conversation = await repo.conversations.findById((await params).id);
  if (!conversation || !conversation.participantIds.includes(user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages: ThreadMessage[] = (await repo.conversations.messages(conversation.id)).map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt,
    senderId: m.senderId,
    mine: m.senderId === user.id,
    readByOthers: m.readBy.some((r) => r !== user.id),
  }));
  return NextResponse.json(messages);
}
