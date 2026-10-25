"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { markConversationRead, sendMessage } from "@/app/actions/messaging";
import { getJson, useLiveQuery } from "@/lib/realtime";
import type { InboxItem } from "@/app/api/conversations/route";
import type { ThreadMessage } from "@/app/api/conversations/[id]/route";
import { initials } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils";

const time = (iso: string) => new Date(iso).toLocaleString("en-PK", { hour: "numeric", minute: "2-digit", day: "numeric", month: "short" });

export function Thread({ conversation, onBack }: { conversation: InboxItem; onBack: () => void }) {
  const qc = useQueryClient();
  const key = ["thread", conversation.id];
  const { data: messages = [], isPending } = useLiveQuery("messages", key, () => getJson<ThreadMessage[]>(`/api/conversations/${conversation.id}`));
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const other = conversation.others[0];

  // Mark as read whenever messages from others arrive while the thread is open.
  const unreadFromOthers = conversation.unread > 0;
  useEffect(() => {
    if (!unreadFromOthers) return;
    void markConversationRead(conversation.id).then(() => {
      void qc.invalidateQueries({ queryKey: ["inbox"] });
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    });
  }, [conversation.id, unreadFromOthers, messages.length, qc]);

  // Block body on purpose: newer browsers return a Promise from scrollIntoView, and an effect must not return one.
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    // Optimistic: show the message immediately, then reconcile with the server's copy.
    const temp: ThreadMessage = { id: `temp-${Date.now()}`, body, createdAt: new Date().toISOString(), senderId: "me", mine: true, readByOthers: false };
    qc.setQueryData<ThreadMessage[]>(key, (old = []) => [...old, temp]);
    setDraft("");
    const res = await sendMessage(conversation.id, body);
    setSending(false);
    if (!res.ok) {
      qc.setQueryData<ThreadMessage[]>(key, (old = []) => old.filter((m) => m.id !== temp.id));
      setDraft(body);
      return void toast.error(res.error);
    }
    void qc.invalidateQueries({ queryKey: key });
    void qc.invalidateQueries({ queryKey: ["inbox"] });
  };

  const lastMine = [...messages].reverse().find((m) => m.mine);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button type="button" onClick={onBack} className="grid size-9 place-items-center rounded-full hover:bg-muted lg:hidden" aria-label="Back to conversations">
          <ArrowLeft className="size-4" />
        </button>
        {other?.avatar ? <Image src={other.avatar} alt="" width={36} height={36} className="size-9 rounded-full object-cover" />
          : <span className="grid size-9 place-items-center rounded-full bg-secondary text-xs">{initials(other?.name ?? "?")}</span>}
        <div className="min-w-0 flex-1">
          <p className="truncate">{other?.name ?? "Conversation"}</p>
          {conversation.listing && <Link href={`/listings/${conversation.listing.id}`} className="block truncate text-xs text-muted-foreground hover:underline">{conversation.listing.title}</Link>}
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5" aria-live="polite" aria-busy={isPending}>
        {messages.map((m) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className={cn("flex flex-col", m.mine ? "items-end" : "items-start")}>
            <p className={cn("max-w-[78%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-[0.95rem] leading-relaxed",
              m.mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted")}>{m.body}</p>
            <span className="mt-1 px-1 text-[0.6875rem] text-meta">
              {time(m.createdAt)}{m.id === lastMine?.id && m.mine ? (m.readByOthers ? " · Seen" : m.id.startsWith("temp") ? " · Sending" : " · Delivered") : ""}
            </span>
          </motion.div>
        ))}
        <div ref={end} />
      </div>

      <form onSubmit={send} className="flex items-end gap-2 border-t border-border p-3">
        <label htmlFor="composer" className="sr-only">Write a message</label>
        <textarea id="composer" value={draft} onChange={(e) => setDraft(e.target.value)} rows={1} maxLength={2000} placeholder="Write a message…"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
          className="max-h-40 min-h-11 flex-1 resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus-visible:border-ring" />
        <button type="submit" disabled={!draft.trim() || sending} aria-label="Send"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40">
          <SendHorizontal className="size-4" />
        </button>
      </form>
    </div>
  );
}
