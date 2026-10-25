import {
  AirVent, ArrowUpDown, Bath, BedDouble, BookOpen, Building, Car, Dumbbell, Flame, GraduationCap, Hospital, Landmark,
  Layers, Leaf, MapPinned, PawPrint, Ruler, ShieldCheck, Sofa, SquareDashed, Sun, Trees, UserRound, Warehouse, Waves, Zap,
  CalendarDays, type LucideIcon,
} from "lucide-react";
import type { Amenity, Listing, Neighbourhood } from "@/lib/data/types";
import { amenityLabels } from "@/lib/labels";
import { formatArea, plotSizeLabel } from "@/lib/format";

const AMENITY_ICONS: Record<Amenity, LucideIcon> = {
  garden: Leaf, pool: Waves, gym: Dumbbell, security: ShieldCheck, backup_power: Zap, lift: ArrowUpDown,
  servant_quarter: UserRound, basement: Warehouse, rooftop: Layers, solar: Sun, gas: Flame, near_school: GraduationCap,
  near_mosque: Landmark, near_park: Trees, near_hospital: Hospital, corner: SquareDashed, park_facing: MapPinned,
  air_conditioning: AirVent, balcony: Building, study: BookOpen,
};

export function KeyFacts({ listing: l }: { listing: Listing }) {
  const facts: { icon: LucideIcon; label: string; value: string }[] = [
    ...(l.beds ? [{ icon: BedDouble, label: "Bedrooms", value: String(l.beds) }] : []),
    ...(l.baths ? [{ icon: Bath, label: "Bathrooms", value: String(l.baths) }] : []),
    { icon: Ruler, label: l.type === "plot" ? "Plot size" : "Covered area", value: l.type === "plot" ? plotSizeLabel(l.areaSqft) : formatArea(l.areaSqft, "sqft") },
    ...(l.plotSqft && l.type !== "plot" ? [{ icon: SquareDashed, label: "Land", value: plotSizeLabel(l.plotSqft) }] : []),
    ...(l.parking ? [{ icon: Car, label: "Parking", value: `${l.parking} car${l.parking > 1 ? "s" : ""}` }] : []),
    ...(l.yearBuilt ? [{ icon: CalendarDays, label: "Built", value: String(l.yearBuilt) }] : []),
    ...(l.type !== "plot" && l.type !== "commercial" ? [{ icon: Sofa, label: "Furnishing", value: l.furnished ? "Furnished" : "Unfurnished" }] : []),
    ...(l.petsAllowed ? [{ icon: PawPrint, label: "Pets", value: "Allowed" }] : []),
  ];
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
      {facts.map(({ icon: Icon, label, value }) => (
        <div key={label} className="bg-card p-4">
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="size-3.5" strokeWidth={1.6} aria-hidden />{label}</dt>
          <dd className="mt-1.5 text-lg">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Amenities({ amenities }: { amenities: Amenity[] }) {
  if (!amenities.length) return null;
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
      {amenities.map((a) => {
        const Icon = AMENITY_ICONS[a];
        return (
          <li key={a} className="flex items-center gap-3 text-[0.95rem]">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary"><Icon className="size-4" strokeWidth={1.6} aria-hidden /></span>
            {amenityLabels[a]}
          </li>
        );
      })}
    </ul>
  );
}

const SCORE_LABELS: Record<keyof Neighbourhood["scores"], string> = {
  walkability: "Walkability", schools: "Schools", safety: "Safety", transport: "Public transport",
};

/** Bars fill with scaleX (transform) rather than width. Scores are illustrative demo values. */
export function NeighbourhoodScores({ neighbourhood: n }: { neighbourhood: Neighbourhood }) {
  return (
    <div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(SCORE_LABELS) as (keyof Neighbourhood["scores"])[]).map((k) => (
          <li key={k}>
            <div className="flex items-baseline justify-between text-sm">
              <span>{SCORE_LABELS[k]}</span>
              <span className="tabular text-muted-foreground">{n.scores[k]}/100</span>
            </div>
            <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-hairline" role="meter" aria-valuenow={n.scores[k]} aria-valuemin={0} aria-valuemax={100} aria-label={SCORE_LABELS[k]}>
              <span className="absolute inset-0 origin-left rounded-full bg-[var(--chart-1)]" style={{ transform: `scaleX(${n.scores[k] / 100})` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-meta">{n.description} Scores are indicative demo values.</p>
    </div>
  );
}
