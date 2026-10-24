import { locale } from "@/config/locale";
import type { Neighbourhood } from "../../types";
import { unsplash } from "./images";

const n = (
  slug: string,
  name: string,
  lat: number,
  lng: number,
  image: string,
  description: string,
  scores: Neighbourhood["scores"],
  avgSalePerSqft: number,
  avgRentPerSqft: number,
): Neighbourhood => ({
  id: `nb-${slug}`,
  slug,
  name,
  city: locale.city,
  center: { lat, lng },
  description,
  image: unsplash(image, 1200),
  scores,
  avgSalePerSqft,
  avgRentPerSqft,
});

/** Reference prices are indicative mock values, not market data. */
export const neighbourhoods: Neighbourhood[] = [
  n("dha-phase-6", "DHA Phase 6", 31.4805, 74.457, "1613490493576-7fde63acd811",
    "Wide boulevards, gated sectors and some of the city's newest family homes, minutes from the Ring Road.",
    { walkability: 62, schools: 88, safety: 92, transport: 58 }, 24000, 60),
  n("gulberg", "Gulberg III", 31.5165, 74.348, "1545324418-cc1a3fa10c00",
    "Lahore's commercial heart: MM Alam Road dining, offices, and apartments within walking distance of everything.",
    { walkability: 86, schools: 82, safety: 80, transport: 85 }, 27000, 70),
  n("model-town", "Model Town", 31.4835, 74.324, "1449844908441-8829872d2607",
    "Leafy, established and quiet, with large older plots arranged around a central park.",
    { walkability: 74, schools: 84, safety: 83, transport: 72 }, 19000, 45),
  n("johar-town", "Johar Town", 31.469, 74.275, "1570129477492-45c003edd2be",
    "Practical and well connected, close to Emporium Mall, the Expo Centre and the Orange Line.",
    { walkability: 70, schools: 78, safety: 72, transport: 76 }, 13500, 34),
  n("bahria-town", "Bahria Town", 31.368, 74.184, "1600585154340-be6161a56a0c",
    "A self-contained town with its own schools, hospital and parks, and the best value per square foot.",
    { walkability: 58, schools: 75, safety: 86, transport: 45 }, 10500, 26),
];
