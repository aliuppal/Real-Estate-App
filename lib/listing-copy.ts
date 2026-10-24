import type { Amenity, PropertyType, Purpose } from "@/lib/data/types";
import { amenityLabels } from "@/lib/labels";
import { formatArea, plotSizeLabel } from "@/lib/format";

export interface DescriptionInput {
  type: PropertyType;
  purpose: Purpose;
  areaSqft: number;
  plotSqft: number | null;
  beds: number;
  baths: number;
  furnished: boolean;
  amenities: Amenity[];
  neighbourhoodName: string;
}

/**
 * Generates listing copy from structured facts.
 * The listing wizard calls this through `DescriptionGenerator`, so an LLM-backed
 * implementation can replace the template without touching callers.
 */
export interface DescriptionGenerator {
  generate(input: DescriptionInput): Promise<string>;
}

const list = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

export function describeListing(i: DescriptionInput): string {
  const perks = i.amenities.slice(0, 4).map((a) => amenityLabels[a].toLowerCase());
  const offer = i.purpose === "rent" ? "available to rent" : "for sale";
  const covered = formatArea(i.areaSqft, "sqft");

  switch (i.type) {
    case "plot":
      return `A ${plotSizeLabel(i.areaSqft)} residential plot in ${i.neighbourhoodName}, ${offer}. ` +
        (perks.length ? `Highlights: ${list(perks)}. ` : "") +
        "Clear title, ready for construction, with utilities available at the boundary.";
    case "commercial":
      return `${covered} of commercial space in ${i.neighbourhoodName}, ${offer}. ` +
        `${i.baths} washroom${i.baths === 1 ? "" : "s"}` +
        (perks.length ? `, plus ${list(perks)}` : "") +
        ". Suited to offices, clinics or retail, with good frontage and footfall.";
    default: {
      const kind = i.type === "apartment" ? "apartment" : i.type === "villa" ? "villa" : "family home";
      const land = i.plotSqft ? ` on ${plotSizeLabel(i.plotSqft)}` : "";
      return `A ${i.furnished ? "fully furnished " : ""}${i.beds}-bedroom ${kind}${land} in ${i.neighbourhoodName}, ${offer}. ` +
        `${i.baths} bathrooms across ${covered} of living space` +
        (perks.length ? `, with ${list(perks)}` : "") +
        ". Bright rooms, a practical layout, and close to schools, markets and main roads.";
    }
  }
}

export const templateDescriptionGenerator: DescriptionGenerator = {
  generate: async (input) => describeListing(input),
};
