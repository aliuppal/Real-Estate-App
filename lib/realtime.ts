"use client";

import { useQuery, type QueryKey } from "@tanstack/react-query";

/**
 * Live updates for messages and notifications. Today this polls with TanStack Query's
 * `refetchInterval`. To switch to Pusher/Ably, subscribe to the channel in `useLiveQuery` and call
 * `queryClient.invalidateQueries({ queryKey })` on each event instead of polling; callers don't change.
 */
export const REALTIME = {
  transport: "poll" as "poll" | "push",
  intervalMs: { messages: 4_000, inbox: 8_000, notifications: 15_000 },
} as const;

export type LiveChannel = keyof typeof REALTIME.intervalMs;

export function useLiveQuery<T>(channel: LiveChannel, queryKey: QueryKey, queryFn: () => Promise<T>, enabled = true) {
  return useQuery({
    queryKey,
    queryFn,
    enabled,
    refetchInterval: REALTIME.transport === "poll" ? REALTIME.intervalMs[channel] : false,
    refetchIntervalInBackground: false,
  });
}

export async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json() as Promise<T>;
}
