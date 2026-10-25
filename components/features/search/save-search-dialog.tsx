"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BellRing } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { saveSearch } from "@/app/actions/engagement";
import { useSaved } from "@/hooks/use-saved";
import type { SearchFilters } from "@/lib/data/types";
import { describeFilters } from "@/lib/search/describe";

/** "Save search" button plus dialog. Guests go to sign in; non-seekers get an explanation. */
export function SaveSearchButton({ filters, nbNames, compact }: { filters: SearchFilters; nbNames: Record<string, string>; compact?: boolean }) {
  const { state } = useSaved();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [alerts, setAlerts] = useState(true);
  const [pending, startTransition] = useTransition();

  const openDialog = () => {
    if (!state?.signedIn) return router.push(`/login?callbackUrl=${encodeURIComponent(`${pathname}?${params}`)}`);
    if (!state.canSave) return toast("Saved searches are for seeker accounts.");
    setName(describeFilters(filters, nbNames));
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveSearch({ name, filters, alertsEnabled: alerts });
      if (!res.ok) return void toast.error(res.error);
      setOpen(false);
      toast.success(alerts ? "Search saved. We'll let you know about new matches." : "Search saved.");
    });
  };

  return (
    <>
      <Button variant="outline" className="h-10 rounded-full px-4" onClick={openDialog} aria-label="Save this search">
        <BellRing className="size-4" aria-hidden />
        {!compact && <span>Save search</span>}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submit} className="space-y-5">
            <DialogHeader>
              <DialogTitle className="text-2xl font-normal">Save this search</DialogTitle>
              <DialogDescription>Find it again from your dashboard, and get notified when new homes match.</DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="saved-search-name" className="font-normal">Name</Label>
              <Input id="saved-search-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required className="h-11" />
            </div>
            <label className="flex items-center justify-between gap-4 rounded-lg bg-muted px-4 py-3 text-sm">
              <span>
                <span className="block">Alert me about new matches</span>
                <span className="text-muted-foreground">In-app notifications when a matching home is listed</span>
              </span>
              <Switch checked={alerts} onCheckedChange={setAlerts} />
            </label>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" size="xl" disabled={pending || !name.trim()}>{pending ? "Saving…" : "Save search"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
