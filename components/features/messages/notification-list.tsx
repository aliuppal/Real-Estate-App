"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Bell, CalendarDays, MessageSquare, Search, UserPlus, Wallet, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markNotificationsRead } from "@/app/actions/messaging";
import { getJson, useLiveQuery } from "@/lib/realtime";
import { formatRelativeDate } from "@/lib/format";
import type { NotificationType } from "@/lib/data/types";
import type { NotificationFeed } from "@/components/layout/live-counts";
import { cn } from "@/lib/utils";

const ICONS: Record<NotificationType, LucideIcon> = {
  saved_search_match: Search, message: MessageSquare, viewing: CalendarDays, offer: Wallet, lead: UserPlus, verification: BadgeCheck, system: Bell,
};

export function NotificationList({ initial }: { initial: NotificationFeed }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data = initial } = useLiveQuery("notifications", ["notifications"], () => getJson<NotificationFeed>("/api/notifications"));

  const markRead = async (ids: string[] | "all") => {
    // Optimistic: clear the dots now, then refresh from the server.
    qc.setQueryData<NotificationFeed>(["notifications"], (old) => old && {
      ...old,
      unread: ids === "all" ? 0 : Math.max(0, old.unread - ids.length),
      items: old.items.map((n) => (ids === "all" || ids.includes(n.id) ? { ...n, read: true } : n)),
    });
    await markNotificationsRead(ids);
    void qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  if (!data.items.length) return <p className="rounded-media border border-dashed border-hairline py-16 text-center text-muted-foreground">You&apos;re all caught up.</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground" aria-live="polite">{data.unread ? `${data.unread} unread` : "All read"}</p>
        {data.unread > 0 && <Button variant="outline" className="rounded-full" onClick={() => void markRead("all")}>Mark all as read</Button>}
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-media border border-border bg-card">
        {data.items.map((n) => {
          const Icon = ICONS[n.type];
          return (
            <li key={n.id}>
              <button type="button" onClick={() => { if (!n.read) void markRead([n.id]); if (n.href) router.push(n.href); }}
                className={cn("flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-muted", !n.read && "bg-secondary/40")}>
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary"><Icon className="size-4" strokeWidth={1.6} aria-hidden /></span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block", !n.read && "font-medium")}>{n.title}</span>
                  {n.body && <span className="block truncate text-sm text-muted-foreground">{n.body}</span>}
                </span>
                <span className="shrink-0 text-xs text-meta">{formatRelativeDate(n.createdAt)}</span>
                {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-cta" aria-label="Unread" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
