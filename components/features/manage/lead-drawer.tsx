"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { addLeadNote, assignLead } from "@/app/actions/crm";
import { LEAD_STAGES, type Lead, type LeadNote, type LeadStage } from "@/lib/data/types";
import { leadStageLabels } from "@/lib/labels";
import { formatPrice, formatRelativeDate } from "@/lib/format";

const SOURCE: Record<Lead["source"], string> = {
  listing_enquiry: "Listing enquiry", match_quiz: "Match quiz", call_back: "Call-back request", handover: "Owner handover", referral: "Referral",
};

interface LeadDrawerProps {
  lead: Lead | null;
  listingTitle: string | null;
  team?: { id: string; name: string }[];
  onClose: () => void;
  onStage: (lead: Lead, stage: LeadStage) => void;
  onNote: (leadId: string, note: LeadNote) => void;
}

export function LeadDrawer({ lead, listingTitle, team, onClose, onStage, onNote }: LeadDrawerProps) {
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  const saveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !note.trim()) return;
    startTransition(async () => {
      const res = await addLeadNote(lead.id, note);
      if (!res.ok || !res.data) return void toast.error(res.ok ? "Lead not found" : res.error);
      onNote(lead.id, res.data);
      setNote("");
    });
  };

  const timeline = lead ? [
    ...lead.notes.map((n) => ({ id: n.id, at: n.createdAt, text: n.body, kind: "Note" })),
    { id: "created", at: lead.createdAt, text: `Came in via ${SOURCE[lead.source].toLowerCase()}`, kind: "Created" },
  ] : [];

  return (
    <Sheet open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {lead && (
          <>
            <SheetHeader className="border-b border-border px-6 py-5">
              <SheetTitle className="text-2xl font-normal">{lead.name}</SheetTitle>
              <p className="text-sm text-muted-foreground">{SOURCE[lead.source]} · {formatRelativeDate(lead.createdAt)}</p>
            </SheetHeader>
            <div className="space-y-6 px-6 py-5">
              <dl className="space-y-2 text-sm">
                <div className="flex gap-3"><dt className="w-20 text-muted-foreground">Email</dt><dd><a href={`mailto:${lead.email}`} className="underline-offset-4 hover:underline">{lead.email}</a></dd></div>
                {lead.phone && <div className="flex gap-3"><dt className="w-20 text-muted-foreground">Phone</dt><dd><a href={`tel:${lead.phone.replace(/\s/g, "")}`} className="tabular">{lead.phone}</a></dd></div>}
                {lead.budget && <div className="flex gap-3"><dt className="w-20 text-muted-foreground">Budget</dt><dd className="tabular">{formatPrice(lead.budget, { compact: true })}</dd></div>}
                {listingTitle && lead.listingId && <div className="flex gap-3"><dt className="w-20 text-muted-foreground">Listing</dt><dd><Link href={`/listings/${lead.listingId}`} className="underline-offset-4 hover:underline">{listingTitle}</Link></dd></div>}
              </dl>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">Stage
                  <select value={lead.stage} onChange={(e) => onStage(lead, e.target.value as LeadStage)} className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-2 text-sm">
                    {LEAD_STAGES.map((s) => <option key={s} value={s}>{leadStageLabels[s]}</option>)}
                  </select>
                </label>
                {team && (
                  <label className="text-sm">Assigned to
                    <select value={lead.agentId} onChange={(e) => startTransition(async () => {
                      const res = await assignLead(lead.id, e.target.value);
                      if (res.ok) { toast.success("Lead reassigned"); onClose(); } else toast.error(res.error);
                    })} className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-2 text-sm">
                      {team.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </label>
                )}
              </div>

              <form onSubmit={saveNote} className="space-y-2">
                <label htmlFor="lead-note" className="text-sm">Add a note</label>
                <Textarea id="lead-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} placeholder="Called, wants to see it Saturday…" />
                <Button type="submit" size="sm" disabled={pending || !note.trim()}>Save note</Button>
              </form>

              <section aria-label="Timeline">
                <h3 className="mono-label mb-3 text-meta">Timeline</h3>
                <ol className="space-y-4 border-l border-hairline pl-4">
                  {timeline.map((t) => (
                    <li key={t.id} className="relative">
                      <span className="absolute -left-[1.3rem] top-1.5 size-2 rounded-full bg-[var(--chart-1)]" aria-hidden />
                      <p className="text-xs text-muted-foreground">{t.kind} · {formatRelativeDate(t.at)}</p>
                      <p className="text-sm">{t.text}</p>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
