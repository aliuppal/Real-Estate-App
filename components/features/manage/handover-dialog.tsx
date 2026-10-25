"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { handOverToAgents } from "@/app/actions/listings";
import { cn } from "@/lib/utils";

export type HandoverMatch = { agentId: string; name: string; photo: string; score: number; reason: string };

/** Owner picks up to three matched agents to pitch for selling or letting their listing. */
export function HandoverDialog({ listingId, title, matches }: { listingId: string; title: string; matches: HandoverMatch[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>(matches.slice(0, 2).map((m) => m.agentId));
  const [pending, startTransition] = useTransition();
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 3 ? [...p, id] : p));

  const submit = () => startTransition(async () => {
    const res = await handOverToAgents(listingId, picked);
    if (!res.ok) return void toast.error(res.error);
    setOpen(false);
    toast.success(`${res.data.invited} agent${res.data.invited === 1 ? "" : "s"} invited to pitch`);
    router.refresh();
  });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Hand over to an agent</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-normal">Hand over to an agent</DialogTitle>
            <DialogDescription>We matched agents who sell homes like “{title}”. Pick up to three; each gets a lead and can pitch to you.</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2" role="group" aria-label="Matched agents">
            {matches.map((m) => {
              const on = picked.includes(m.agentId);
              return (
                <li key={m.agentId}>
                  <button type="button" aria-pressed={on} onClick={() => toggle(m.agentId)}
                    className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left", on ? "border-primary bg-secondary" : "border-hairline hover:border-foreground/30")}>
                    {m.photo && <Image src={m.photo} alt="" width={40} height={40} className="size-10 rounded-full object-cover" />}
                    <span className="min-w-0 flex-1"><span className="block">{m.name}</span><span className="block truncate text-xs text-muted-foreground">{m.reason}</span></span>
                    <span className="tabular text-sm">{m.score}%</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="xl" disabled={pending || !picked.length} onClick={submit}>{pending ? "Inviting…" : `Invite ${picked.length} agent${picked.length === 1 ? "" : "s"}`}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
