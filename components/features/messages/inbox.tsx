"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import { getJson, useLiveQuery } from "@/lib/realtime";
import { formatRelativeDate } from "@/lib/format";
import type { InboxItem } from "@/app/api/conversations/route";
import { initials } from "@/components/layout/user-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Thread } from "./thread";

/** Two-pane inbox: conversation list (polled) and the open thread, chosen by ?c= in the URL. */
export function Inbox({ initial }: { initial: InboxItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selectedId = params.get("c");
  const { data: items = initial, isPending } = useLiveQuery("inbox", ["inbox"], () => getJson<InboxItem[]>("/api/conversations"));
  const selected = items.find((c) => c.id === selectedId) ?? null;
  const select = (id: string | null) => router.replace(id ? `${pathname}?c=${id}` : pathname, { scroll: false });

  return (
    <div className="grid h-[calc(100dvh-14rem)] min-h-[480px] overflow-hidden rounded-media border border-border bg-card lg:grid-cols-[340px_1fr]">
      <nav aria-label="Conversations" className={cn("min-h-0 overflow-y-auto border-r border-border", selected && "hidden lg:block")}>
        {isPending && !items.length ? (
          <div className="space-y-3 p-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : !items.length ? (
          <p className="p-6 text-sm text-muted-foreground">No conversations yet. Message an agent or owner from any listing.</p>
        ) : (
          <ul>
            {items.map((c) => {
              const other = c.others[0];
              return (
                <li key={c.id}>
                  <button type="button" onClick={() => select(c.id)} aria-current={c.id === selectedId}
                    className={cn("flex w-full gap-3 border-b border-border px-4 py-3.5 text-left transition-colors hover:bg-muted", c.id === selectedId && "bg-secondary")}>
                    {other?.avatar ? <Image src={other.avatar} alt="" width={40} height={40} className="size-10 shrink-0 rounded-full object-cover" />
                      : <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-xs">{initials(other?.name ?? "?")}</span>}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cn("truncate", c.unread > 0 && "font-medium")}>{other?.name ?? "Conversation"}</span>
                        {c.last && <span className="shrink-0 text-[0.6875rem] text-meta">{formatRelativeDate(c.last.createdAt)}</span>}
                      </span>
                      {c.listing && <span className="block truncate text-xs text-muted-foreground">{c.listing.title}</span>}
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className={cn("truncate text-sm", c.unread ? "text-foreground" : "text-muted-foreground")}>{c.last ? `${c.last.mine ? "You: " : ""}${c.last.body}` : "No messages yet"}</span>
                        {c.unread > 0 && <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-cta px-1.5 text-[0.6875rem] text-cta-foreground">{c.unread}</span>}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
      <section aria-label="Conversation" className={cn("min-h-0", !selected && "hidden lg:block")}>
        {selected ? (
          <Thread key={selected.id} conversation={selected} onBack={() => select(null)} />
        ) : (
          <div className="grid h-full place-items-center p-8 text-center text-muted-foreground">
            <div><MessagesSquare className="mx-auto size-8 text-meta" strokeWidth={1.4} aria-hidden /><p className="mt-3">Choose a conversation</p></div>
          </div>
        )}
      </section>
    </div>
  );
}
