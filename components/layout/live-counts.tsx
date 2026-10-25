"use client";

import { getJson, useLiveQuery } from "@/lib/realtime";
import type { Notification } from "@/lib/data/types";

export type NotificationFeed = { unread: number; unreadMessages: number; items: Notification[] };

/** Unread notification and message counts, polled through the realtime layer. Seeds from server values. */
export function useUnreadCounts(initial: { unread: number; unreadMessages: number }, enabled = true) {
  const { data } = useLiveQuery("notifications", ["notifications"], () => getJson<NotificationFeed>("/api/notifications"), enabled);
  return { unread: data?.unread ?? initial.unread, unreadMessages: data?.unreadMessages ?? initial.unreadMessages };
}
