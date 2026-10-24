import type { Agency } from "../../types";
import { daysAgo } from "./random";
import { unsplash } from "./images";

const a = (
  n: number,
  slug: string,
  name: string,
  domain: string,
  description: string,
  foundedYear: number,
  serviceAreas: string[],
  cover: string,
  verification: Agency["verification"] = "verified",
): Agency => ({
  id: `ag-${n}`,
  slug,
  name,
  logo: `/agencies/${slug}.svg`,
  cover: unsplash(cover, 1600),
  description,
  foundedYear,
  phone: `+92 42 3570 ${1000 + n * 111}`,
  email: `hello@${domain}`,
  website: `https://${domain}`,
  serviceAreas: serviceAreas.map((s) => `nb-${s}`),
  verification,
  // Recomputed from seeded reviews in seed/index.ts.
  rating: 0,
  reviewCount: 0,
  createdAt: daysAgo(400 + n * 90),
});

export const agencies: Agency[] = [
  a(1, "crescent-realty", "Crescent Realty", "crescentrealty.pk",
    "A boutique team focused on premium family homes and villas across DHA and Gulberg.",
    2011, ["dha-phase-6", "gulberg"], "1600596542815-ffad4c1539a9"),
  a(2, "ravi-property-partners", "Ravi Property Partners", "raviproperty.pk",
    "City-centre specialists for apartments, rentals and commercial space.",
    2008, ["gulberg", "model-town", "johar-town"], "1486406146926-c627a92ad1ab"),
  a(3, "canal-view-estates", "Canal View Estates", "canalview.pk",
    "Helping first-time buyers and growing families find their footing in Johar and Model Town.",
    2015, ["johar-town", "model-town"], "1568605114967-8130f3a36994"),
  a(4, "lahore-prime-homes", "Lahore Prime Homes", "lahoreprime.pk",
    "Plots, new builds and investment property in Bahria Town and Johar Town.",
    2017, ["bahria-town", "johar-town"], "1500382017468-9049fed747ef"),
  a(5, "heritage-lane-realtors", "Heritage Lane Realtors", "heritagelane.pk",
    "A new agency bringing together senior agents from across the city.",
    2026, ["dha-phase-6", "model-town", "bahria-town"], "1580587771525-78b9dba3b914", "pending"),
];
