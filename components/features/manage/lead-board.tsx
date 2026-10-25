"use client";

import { useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { moveLead } from "@/app/actions/crm";
import { LEAD_STAGES, type Lead, type LeadStage } from "@/lib/data/types";
import { leadStageLabels } from "@/lib/labels";
import { formatPrice, formatRelativeDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LeadDrawer } from "./lead-drawer";

interface LeadBoardProps {
  initial: Lead[];
  listingTitles: Record<string, string>;
  agentNames?: Record<string, string>;
  team?: { id: string; name: string }[];
}

function Card({ lead, listingTitle, agentName, onOpen }: { lead: Lead; listingTitle?: string; agentName?: string; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  return (
    <li
      ref={setNodeRef}
      // Dragging moves the card with a transform only.
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn("touch-none rounded-lg border border-border bg-card p-3 text-sm shadow-sm", isDragging && "relative z-50 shadow-lg ring-2 ring-ring")}
      {...attributes}
      {...listeners}
    >
      <button type="button" onClick={onOpen} onPointerDown={(e) => e.stopPropagation()} className="block w-full text-left">
        <span className="block truncate font-medium">{lead.name}</span>
        {listingTitle && <span className="block truncate text-xs text-muted-foreground">{listingTitle}</span>}
        <span className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{lead.budget ? formatPrice(lead.budget, { compact: true }) : "No budget"}</span>
          <span>{formatRelativeDate(lead.updatedAt)}</span>
        </span>
        {agentName && <span className="mt-1 block truncate text-xs text-meta">{agentName}</span>}
      </button>
    </li>
  );
}

function Column({ stage, count, children }: { stage: LeadStage; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <section ref={setNodeRef} aria-label={`${leadStageLabels[stage]}, ${count} leads`}
      className={cn("flex w-64 shrink-0 flex-col rounded-xl bg-muted p-2 transition-colors lg:w-auto", isOver && "bg-secondary")}>
      <h2 className="flex items-center justify-between px-2 py-2 text-sm">
        <span className="mono-label text-[0.6875rem]">{leadStageLabels[stage]}</span>
        <span className="tabular text-muted-foreground">{count}</span>
      </h2>
      <ul className="flex min-h-24 flex-1 flex-col gap-2">{children}</ul>
    </section>
  );
}

/** Lead pipeline kanban. Drag (mouse, touch or keyboard: space to lift, arrows to move) to change stage. */
export function LeadBoard({ initial, listingTitles, agentNames, team }: LeadBoardProps) {
  const [leads, setLeads] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));

  const changeStage = async (lead: Lead, stage: LeadStage) => {
    if (lead.stage === stage) return;
    const previous = leads;
    setLeads((ls) => ls.map((l) => (l.id === lead.id ? { ...l, stage, updatedAt: new Date().toISOString() } : l)));
    const res = await moveLead(lead.id, stage);
    if (!res.ok) {
      setLeads(previous);
      toast.error(res.error);
    } else toast.success(`${lead.name} moved to ${leadStageLabels[stage]}`);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const lead = leads.find((l) => l.id === active.id);
    if (lead && over) void changeStage(lead, over.id as LeadStage);
  };

  const open = leads.find((l) => l.id === openId) ?? null;

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0">
          {LEAD_STAGES.map((stage) => {
            const items = leads.filter((l) => l.stage === stage);
            return (
              <Column key={stage} stage={stage} count={items.length}>
                {items.map((l) => (
                  <Card key={l.id} lead={l} listingTitle={l.listingId ? listingTitles[l.listingId] : undefined}
                    agentName={agentNames?.[l.agentId]} onOpen={() => setOpenId(l.id)} />
                ))}
              </Column>
            );
          })}
        </div>
      </DndContext>
      <LeadDrawer
        lead={open}
        listingTitle={open?.listingId ? listingTitles[open.listingId] ?? null : null}
        team={team}
        onClose={() => setOpenId(null)}
        onStage={(lead, stage) => void changeStage(lead, stage)}
        onNote={(leadId, note) => setLeads((ls) => ls.map((l) => (l.id === leadId ? { ...l, notes: [note, ...l.notes] } : l)))}
      />
    </>
  );
}
