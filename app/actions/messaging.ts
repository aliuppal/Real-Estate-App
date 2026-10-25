"use server";

import { z } from "zod";
import { repo } from "@/lib/data";
import { ActionError, actionUser, runAction } from "@/lib/auth/action";
import { notify } from "@/lib/notify";

async function membership(conversationId: string) {
  const user = await actionUser();
  const conversation = await repo.conversations.findById(z.string().min(1).parse(conversationId));
  if (!conversation || !conversation.participantIds.includes(user.id)) throw new ActionError("Conversation not found.");
  return { user, conversation };
}

export async function sendMessage(conversationId: string, body: string) {
  return runAction(async () => {
    const { user, conversation } = await membership(conversationId);
    const text = z.string().trim().min(1, "Write a message").max(2000).parse(body);
    const message = await repo.conversations.send(conversation.id, user.id, text);
    // One notification per unread burst: skip recipients who already have an unread one for this thread.
    const href = `/dashboard/messages?c=${conversation.id}`;
    for (const other of conversation.participantIds.filter((p) => p !== user.id)) {
      const pending = (await repo.notifications.forUser(other)).some((n) => !n.read && n.href === href);
      if (!pending) await notify([other], { type: "message", title: `New message from ${user.name}`, body: text.slice(0, 120), href });
    }
    return message;
  });
}

export async function markConversationRead(conversationId: string) {
  return runAction(async () => {
    const { user, conversation } = await membership(conversationId);
    await repo.conversations.markRead(conversation.id, user.id);
    const href = `/dashboard/messages?c=${conversation.id}`;
    const related = (await repo.notifications.forUser(user.id)).filter((n) => !n.read && n.href === href).map((n) => n.id);
    if (related.length) await repo.notifications.markRead(user.id, related);
  });
}

export async function markNotificationsRead(ids: string[] | "all") {
  return runAction(async () => {
    const user = await actionUser();
    await repo.notifications.markRead(user.id, ids === "all" ? "all" : z.array(z.string()).max(200).parse(ids));
  });
}
