"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { makeOffer, requestCallback, requestViewing, sendEnquiry } from "@/app/actions/contact";
import type { DaySlots } from "@/lib/availability";
import { formatInLahore } from "@/lib/availability";
import type { Purpose } from "@/lib/data/types";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ContactKind = "message" | "viewing" | "callback" | "offer";

interface ContactDialogProps {
  kind: ContactKind | null;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  contactName: string;
  purpose: Purpose;
  price: number;
  slots: DaySlots[];
}

const COPY: Record<ContactKind, { title: string; description: (name: string) => string }> = {
  message: { title: "Send a message", description: (n) => `${n} usually replies in the Nestly inbox.` },
  viewing: { title: "Book a viewing", description: (n) => `Pick a time that suits you. ${n} will confirm it.` },
  callback: { title: "Request a call back", description: (n) => `${n} will call you on this number.` },
  offer: { title: "Make an offer", description: () => "Your offer goes to the seller with your message." },
};

export function ContactDialog({ kind, onClose, listingId, listingTitle, contactName, purpose, price, slots }: ContactDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState(`Hi, I'm interested in “${listingTitle}”. Is it still available?`);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState("");
  const [when, setWhen] = useState<"morning" | "afternoon" | "evening">("afternoon");
  const [amount, setAmount] = useState(String(purpose === "sale" ? Math.round(price * 0.95) : price));

  const title = kind === "offer" && purpose === "rent" ? "Apply to rent" : kind ? COPY[kind].title : "";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      let result: { ok: boolean; error?: string; data?: unknown };
      if (kind === "message") result = await sendEnquiry({ listingId, body: message });
      else if (kind === "viewing") result = slot ? await requestViewing({ listingId, start: slot, note: note.trim() || null }) : { ok: false, error: "Pick a time first." };
      else if (kind === "callback") result = await requestCallback({ listingId, phone, when });
      else result = await makeOffer({ listingId, amount: Math.round(Number(amount)), message: note.trim() || null });

      if (!result.ok) return void toast.error(result.error);
      onClose();
      if (kind === "message") {
        toast.success("Message sent", { action: { label: "Open inbox", onClick: () => router.push("/dashboard/messages") } });
      } else {
        toast.success({ viewing: "Viewing requested. You'll be notified when it's confirmed.", callback: "Call-back requested.", offer: purpose === "rent" ? "Application sent." : "Offer sent." }[kind!]);
      }
      router.refresh();
    });
  };

  return (
    <Dialog open={kind !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {kind && (
          <form onSubmit={submit} className="space-y-5">
            <DialogHeader>
              <DialogTitle className="text-2xl font-normal">{title}</DialogTitle>
              <DialogDescription>{COPY[kind].description(contactName)}</DialogDescription>
            </DialogHeader>

            {kind === "message" && (
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={2000} required aria-label="Message" />
            )}

            {kind === "viewing" && (
              <div className="space-y-4">
                <div role="tablist" aria-label="Day" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                  {slots.map((d, i) => (
                    <button key={d.date} type="button" role="tab" aria-selected={day === i} onClick={() => { setDay(i); setSlot(null); }}
                      className={cn("relative shrink-0 rounded-xl border px-3 py-2 text-center text-sm", day === i ? "border-primary" : "border-hairline hover:border-foreground/30")}>
                      {day === i && <motion.span layoutId="slot-day" className="absolute inset-0 rounded-xl bg-primary" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                      <span className={cn("relative block text-xs", day === i ? "text-primary-foreground/80" : "text-muted-foreground")}>{formatInLahore(`${d.date}T12:00:00+05:00`, { weekday: "short" })}</span>
                      <span className={cn("relative block", day === i && "text-primary-foreground")}>{formatInLahore(`${d.date}T12:00:00+05:00`, { day: "numeric", month: "short" })}</span>
                    </button>
                  ))}
                </div>
                <div role="radiogroup" aria-label="Time" className="grid grid-cols-4 gap-2">
                  {slots[day]?.slots.map((s) => (
                    <button key={s.start} type="button" role="radio" aria-checked={slot === s.start} disabled={!s.available} onClick={() => setSlot(s.start)}
                      className={cn("tabular rounded-lg border py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-35 disabled:line-through",
                        slot === s.start ? "border-primary bg-primary text-primary-foreground" : "border-hairline hover:border-foreground/30")}>
                      {formatInLahore(s.start, { hour: "numeric", minute: "2-digit" })}
                    </button>
                  ))}
                </div>
                <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Anything they should know? (optional)" aria-label="Note" />
                <p className="text-xs text-meta">Times are Lahore time (PKT).</p>
              </div>
            )}

            {kind === "callback" && (
              <div className="space-y-4">
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 3xx xxxxxxx" required aria-label="Phone number" className="h-11" />
                <div role="radiogroup" aria-label="Best time" className="grid grid-cols-3 gap-2">
                  {(["morning", "afternoon", "evening"] as const).map((w) => (
                    <button key={w} type="button" role="radio" aria-checked={when === w} onClick={() => setWhen(w)}
                      className={cn("rounded-lg border py-2 text-sm capitalize", when === w ? "border-primary bg-primary text-primary-foreground" : "border-hairline")}>{w}</button>
                  ))}
                </div>
              </div>
            )}

            {kind === "offer" && (
              <div className="space-y-4">
                <label className="block text-sm">
                  {purpose === "rent" ? "Monthly rent you're offering" : "Your offer"}
                  <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} required className="tabular mt-1.5 h-11" />
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {formatPrice(Number(amount) || 0, { compact: true, purpose })} · asking {formatPrice(price, { compact: true, purpose })}
                  </span>
                </label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000}
                  placeholder={purpose === "rent" ? "Who'll live there, when you'd like to move in, references…" : "Timing, token amount, financing…"} aria-label="Message" />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit" size="xl" disabled={pending || (kind === "viewing" && !slot)}>{pending ? "Sending…" : title}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
