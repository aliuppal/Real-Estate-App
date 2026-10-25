"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Flag, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { reportListing } from "@/app/actions/engagement";
import { SaveButton } from "@/components/features/listings/save-button";
import { cn } from "@/lib/utils";

const REASONS = ["Photos don't match the property", "Wrong price or details", "Already sold or rented", "Looks like a scam", "Other"];

export function ListingActions({ listingId, title, signedIn }: { listingId: string; title: string; signedIn: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [pending, startTransition] = useTransition();

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      // The user closed the share sheet.
    }
  };

  const submitReport = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await reportListing(listingId, details.trim() ? `${reason}: ${details.trim()}` : reason);
      if (!res.ok) return void toast.error(res.error);
      setReportOpen(false);
      toast.success("Thanks. Our team will review this listing.");
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" className="h-10 rounded-full px-4" onClick={share}><Share2 className="size-4" aria-hidden /> Share</Button>
      <SaveButton listingId={listingId} tone="plain" />
      <Button variant="ghost" className="h-10 rounded-full px-3 text-muted-foreground"
        onClick={() => (signedIn ? setReportOpen(true) : router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`))} aria-label="Report this listing">
        <Flag className="size-4" aria-hidden />
      </Button>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitReport} className="space-y-5">
            <DialogHeader>
              <DialogTitle className="text-2xl font-normal">Report this listing</DialogTitle>
              <DialogDescription>Reports are anonymous to the lister.</DialogDescription>
            </DialogHeader>
            <div role="radiogroup" aria-label="Reason" className="space-y-2">
              {REASONS.map((r) => (
                <button key={r} type="button" role="radio" aria-checked={reason === r} onClick={() => setReason(r)}
                  className={cn("block w-full rounded-lg border px-4 py-2.5 text-left text-sm", reason === r ? "border-primary bg-secondary" : "border-hairline")}>{r}</button>
              ))}
            </div>
            <Textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} maxLength={400} placeholder="Add details (optional)" aria-label="Details" />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setReportOpen(false)}>Cancel</Button>
              <Button type="submit" size="xl" disabled={pending}>{pending ? "Sending…" : "Send report"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
