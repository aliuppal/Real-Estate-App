"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createListing } from "@/app/actions/listings";
import type { GeoPoint } from "@/lib/data/types";
import { amenityLabels, typeLabels } from "@/lib/labels";
import { formatArea, formatPrice } from "@/lib/format";
import { listingInputSchema, type ListingInput } from "@/lib/validation/listing";
import { PhotoUploader } from "./photo-uploader";
import { AmenitiesStep, DetailsStep, LocationStep, PricingStep, TypeStep, type Draft } from "./wizard-steps";

const STEPS = ["Type", "Location", "Details", "Amenities", "Photos", "Pricing", "Review"] as const;
const STORAGE_KEY = "nestly:listing-draft";
const EASE = [0.22, 1, 0.36, 1] as const;

const EMPTY: Draft = { purpose: "sale", type: "house", images: [], amenities: [], beds: 3, baths: 3, parking: 1, furnished: false, petsAllowed: false, plotSqft: null, yearBuilt: null, videoUrl: null, agentId: null, depositMonths: 2, advanceMonths: 1 };

/** What each step must have before moving on; the server re-validates everything on submit. */
function stepError(step: number, d: Draft, needsAgent: boolean): string | null {
  if (step === 0 && needsAgent && !d.agentId) return "Choose the agent handling this listing.";
  if (step === 1 && (!d.neighbourhoodId || !d.address || !d.location)) return "Choose a neighbourhood, add the address and drop a pin.";
  if (step === 2 && (!d.areaSqft || !d.title || (d.title?.length ?? 0) < 10 || (d.description?.length ?? 0) < 30)) return "Add the area, a title (10+ characters) and a description (30+ characters).";
  if (step === 4 && !d.images.length) return "Add at least one photo.";
  if (step === 5 && !d.price) return "Set a price.";
  return null;
}

export function ListingWizard({ areas, team }: { areas: { id: string; name: string; center: GeoPoint }[]; team?: { id: string; name: string }[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [pending, startTransition] = useTransition();
  // Accepts a patch or a function of the latest draft, so rapid toggles never read stale state.
  const set = (patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) =>
    setDraft((d) => ({ ...d, ...(typeof patch === "function" ? patch(d) : patch) }));
  const areaName = areas.find((a) => a.id === draft.neighbourhoodId)?.name ?? "";

  // Per-browser autosave so a refresh doesn't lose work.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setDraft({ ...EMPTY, ...JSON.parse(saved) });
    } catch { /* storage unavailable */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch { /* storage unavailable */ }
  }, [draft]);

  const go = (to: number) => {
    if (to > step) {
      const err = stepError(step, draft, !!team);
      if (err) return void toast.error(err);
    }
    setDir(to > step ? 1 : -1);
    setStep(to);
  };

  const submit = (publish: boolean) => {
    const parsed = listingInputSchema.safeParse({ ...EMPTY, ...draft, beds: draft.beds ?? 0, baths: draft.baths ?? 0, parking: draft.parking ?? 0 });
    if (!parsed.success) return void toast.error(parsed.error.issues[0]?.message ?? "Some details are missing.");
    startTransition(async () => {
      const res = await createListing(parsed.data as ListingInput, publish);
      if (!res.ok) return void toast.error(res.error);
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      toast.success(publish ? "Your listing is live" : "Saved as a draft");
      router.push(`/listings/${res.data.id}`);
    });
  };

  return (
    <div>
      <ol className="mb-10 flex gap-1.5" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <button type="button" onClick={() => i < step && go(i)} disabled={i > step} aria-current={i === step ? "step" : undefined} className="w-full text-left disabled:cursor-default">
              <span className="relative block h-1 overflow-hidden rounded-full bg-hairline">
                <span className="absolute inset-0 origin-left bg-primary transition-transform duration-500 ease-[var(--ease-out-quint)]" style={{ transform: `scaleX(${i <= step ? 1 : 0})` }} />
              </span>
              <span className={`mt-2 hidden text-xs sm:block ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
            </button>
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait" initial={false}>
        <motion.section key={step} aria-label={STEPS[step]} initial={{ opacity: 0, x: dir * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -24 }} transition={{ duration: 0.3, ease: EASE }}>
          <h2 className="mb-6 text-3xl">{["What are you listing?", "Where is it?", "Tell us about it", "What does it have?", "Add photos", "Set your price", "Review and publish"][step]}</h2>
          {step === 0 && <TypeStep draft={draft} set={set} team={team} />}
          {step === 1 && <LocationStep draft={draft} set={set} areas={areas} />}
          {step === 2 && <DetailsStep draft={draft} set={set} areaName={areaName} />}
          {step === 3 && <AmenitiesStep draft={draft} set={set} />}
          {step === 4 && <PhotoUploader value={draft.images} onChange={(images) => set({ images })} />}
          {step === 5 && <PricingStep draft={draft} set={set} />}
          {step === 6 && (
            <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-media bg-muted">{draft.images[0] && <Image src={draft.images[0]} alt="Cover photo" fill sizes="40vw" className="object-cover" />}</div>
              <dl className="space-y-3 text-sm">
                {[
                  ["Listing", `${typeLabels[draft.type]} ${draft.purpose === "rent" ? "to rent" : "for sale"}`],
                  ["Title", draft.title], ["Where", `${draft.address}, ${areaName}`],
                  ["Size", draft.areaSqft ? formatArea(draft.areaSqft, "sqft") : "–"],
                  ["Rooms", `${draft.beds ?? 0} bed · ${draft.baths ?? 0} bath`],
                  ["Amenities", draft.amenities.map((a) => amenityLabels[a]).join(", ") || "None"],
                  ["Photos", String(draft.images.length)],
                  ["Price", draft.price ? formatPrice(draft.price, { purpose: draft.purpose }) : "–"],
                ].map(([k, v]) => <div key={k} className="flex gap-4 border-b border-border pb-3"><dt className="w-24 shrink-0 text-muted-foreground">{k}</dt><dd>{v}</dd></div>)}
              </dl>
            </div>
          )}
        </motion.section>
      </AnimatePresence>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
        <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}><ArrowLeft className="size-4" aria-hidden /> Back</Button>
        {step < STEPS.length - 1 ? (
          <Button size="xl" onClick={() => go(step + 1)}>Continue <ArrowRight className="size-4" aria-hidden /></Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="xl" disabled={pending} onClick={() => submit(false)}>Save draft</Button>
            <Button size="xl" disabled={pending} onClick={() => submit(true)}>{pending ? "Publishing…" : "Publish listing"}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
