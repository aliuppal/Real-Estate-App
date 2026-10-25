"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateAgencyProfile } from "@/app/actions/agency";
import type { Agency } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export function AgencyProfileForm({ agency, areas }: { agency: Agency; areas: { id: string; name: string }[] }) {
  const [description, setDescription] = useState(agency.description);
  const [phone, setPhone] = useState(agency.phone);
  const [website, setWebsite] = useState(agency.website ?? "");
  const [serviceAreas, setServiceAreas] = useState(agency.serviceAreas);
  const [pending, startTransition] = useTransition();

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateAgencyProfile({ description, phone, website: website.trim() || null, serviceAreas });
      if (res.ok) toast.success("Agency profile saved");
      else toast.error(res.error);
    });
  };

  return (
    <form onSubmit={save} className="max-w-3xl space-y-5 rounded-media border border-border bg-card p-6 sm:p-8">
      <label className="block text-sm">About the agency
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={1000} className="mt-1.5" />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm">Phone<Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5 h-11" /></label>
        <label className="text-sm">Website<Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" className="mt-1.5 h-11" /></label>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm">Areas you cover</legend>
        <div className="flex flex-wrap gap-2">
          {areas.map((a) => {
            const on = serviceAreas.includes(a.id);
            return (
              <button key={a.id} type="button" aria-pressed={on} onClick={() => setServiceAreas((s) => (on ? s.filter((x) => x !== a.id) : [...s, a.id]))}
                className={cn("rounded-full border px-3.5 py-1.5 text-sm", on ? "border-primary bg-primary text-primary-foreground" : "border-hairline")}>{a.name}</button>
            );
          })}
        </div>
      </fieldset>
      <Button type="submit" size="xl" disabled={pending}>{pending ? "Saving…" : "Save profile"}</Button>
    </form>
  );
}
