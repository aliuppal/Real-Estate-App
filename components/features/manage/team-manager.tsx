"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inviteAgent, removeAgent } from "@/app/actions/agency";
import type { Agent } from "@/lib/data/types";
import { StatusPill } from "@/components/dashboard/stat-card";
import { initials } from "@/components/layout/user-menu";

export type TeamRow = Agent & { listings: number; openLeads: number };

export function TeamManager({ team }: { team: TeamRow[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();

  const invite = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await inviteAgent(email);
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.data.status === "added" ? `${res.data.name} joined your team` : "Invitation recorded. Email delivery isn't connected yet, so share the signup link with them.");
      setEmail("");
      router.refresh();
    });
  };

  const remove = (a: TeamRow) => {
    if (!window.confirm(`Remove ${a.name} from your agency? Their listings stay with them.`)) return;
    startTransition(async () => {
      const res = await removeAgent(a.id);
      if (!res.ok) return void toast.error(res.error);
      toast.success(`${a.name} removed`);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={invite} className="flex flex-wrap items-end gap-3 rounded-media border border-border bg-card p-5">
        <label className="min-w-64 flex-1 text-sm">Invite an agent by email
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@example.com" className="mt-1.5 h-11" />
        </label>
        <Button type="submit" size="xl" disabled={pending}>Invite</Button>
      </form>
      <ul className="divide-y divide-border overflow-hidden rounded-media border border-border bg-card">
        {team.map((a, i) => (
          <li key={a.id} className="flex flex-wrap items-center gap-4 p-5">
            <span className="tabular w-6 text-muted-foreground">{i + 1}</span>
            {a.photo ? <Image src={a.photo} alt="" width={44} height={44} className="size-11 rounded-full object-cover" /> : <span className="grid size-11 place-items-center rounded-full bg-secondary text-xs">{initials(a.name)}</span>}
            <div className="min-w-0 flex-1">
              <Link href={`/agents/${a.slug}`} className="underline-offset-4 hover:underline">{a.name}</Link>
              <p className="text-sm text-muted-foreground">{a.dealsClosed} deals · {a.rating ? a.rating.toFixed(1) : "–"} rating · {a.listings} listings · {a.openLeads} open leads</p>
            </div>
            <StatusPill status={a.verification} />
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => remove(a)}>Remove</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
