"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateAgentProfile, updateProfile } from "@/app/actions/account";
import { PROPERTY_TYPES, type Agent, type PropertyType, type Purpose } from "@/lib/data/types";
import { typeLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";

const card = "rounded-media border border-border bg-card p-6 sm:p-8";
const chip = (on: boolean) => cn("rounded-full border px-3.5 py-1.5 text-sm transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "border-hairline hover:border-foreground/40");
const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export function ProfileForm({ name: initialName, email, phone: initialPhone }: { name: string; email: string; phone: string | null }) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [pending, startTransition] = useTransition();
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateProfile({ name, phone: phone.trim() || null });
      if (res.ok) toast.success("Profile saved");
      else toast.error(res.error);
    });
  };
  return (
    <form onSubmit={save} className={cn(card, "space-y-5")}>
      <h2 className="text-2xl">Your details</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="pf-name" className="font-normal">Full name</Label><Input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} required className="h-11" /></div>
        <div className="space-y-1.5"><Label htmlFor="pf-phone" className="font-normal">Phone</Label><Input id="pf-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 3xx xxxxxxx" className="h-11" /></div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pf-email" className="font-normal">Email</Label>
        <Input id="pf-email" value={email} disabled className="h-11" />
        <p className="text-xs text-muted-foreground">Contact support to change your sign-in email.</p>
      </div>
      <Button type="submit" size="xl" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
    </form>
  );
}

export function AgentProfileForm({ agent, areas }: { agent: Agent; areas: { id: string; name: string }[] }) {
  const [title, setTitle] = useState(agent.title);
  const [bio, setBio] = useState(agent.bio);
  const [languages, setLanguages] = useState(agent.languages.join(", "));
  const [specialties, setSpecialties] = useState<PropertyType[]>(agent.specialties);
  const [purposes, setPurposes] = useState<Purpose[]>(agent.purposes);
  const [serviceAreas, setServiceAreas] = useState<string[]>(agent.serviceAreas);
  const [years, setYears] = useState(String(agent.yearsExperience));
  const [pending, startTransition] = useTransition();

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateAgentProfile({
        title, bio, specialties, purposes, serviceAreas, yearsExperience: Number(years) || 0,
        languages: languages.split(",").map((l) => l.trim()).filter(Boolean),
      });
      if (res.ok) toast.success("Public profile updated");
      else toast.error(res.error);
    });
  };

  return (
    <form onSubmit={save} className={cn(card, "space-y-6")}>
      <div>
        <h2 className="text-2xl">Public agent profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">This is what seekers see on your profile and in the matching quiz.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
        <div className="space-y-1.5"><Label htmlFor="ap-title" className="font-normal">Title</Label><Input id="ap-title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-11" /></div>
        <div className="space-y-1.5"><Label htmlFor="ap-years" className="font-normal">Years</Label><Input id="ap-years" type="number" min={0} max={60} value={years} onChange={(e) => setYears(e.target.value)} className="h-11" /></div>
      </div>
      <div className="space-y-1.5"><Label htmlFor="ap-bio" className="font-normal">Bio</Label><Textarea id="ap-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={800} /></div>
      <div className="space-y-1.5"><Label htmlFor="ap-lang" className="font-normal">Languages (comma separated)</Label><Input id="ap-lang" value={languages} onChange={(e) => setLanguages(e.target.value)} className="h-11" /></div>
      <fieldset><legend className="mb-2 text-sm">Specialties</legend>
        <div className="flex flex-wrap gap-2">{PROPERTY_TYPES.map((t) => <button key={t} type="button" aria-pressed={specialties.includes(t)} onClick={() => setSpecialties((s) => toggle(s, t))} className={chip(specialties.includes(t))}>{typeLabels[t]}</button>)}</div>
      </fieldset>
      <fieldset><legend className="mb-2 text-sm">Handles</legend>
        <div className="flex flex-wrap gap-2">{(["sale", "rent"] as const).map((p) => <button key={p} type="button" aria-pressed={purposes.includes(p)} onClick={() => setPurposes((s) => toggle(s, p))} className={chip(purposes.includes(p))}>{p === "sale" ? "Sales" : "Rentals"}</button>)}</div>
      </fieldset>
      <fieldset><legend className="mb-2 text-sm">Areas you cover (up to 5)</legend>
        <div className="flex flex-wrap gap-2">{areas.map((a) => <button key={a.id} type="button" aria-pressed={serviceAreas.includes(a.id)} onClick={() => setServiceAreas((s) => toggle(s, a.id))} className={chip(serviceAreas.includes(a.id))}>{a.name}</button>)}</div>
      </fieldset>
      <Button type="submit" size="xl" disabled={pending}>{pending ? "Saving…" : "Save profile"}</Button>
    </form>
  );
}
