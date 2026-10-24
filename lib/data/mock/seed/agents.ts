import type { Agent, PropertyType, Purpose } from "../../types";
import { PORTRAITS, portrait } from "./images";
import { daysAgo } from "./random";

type AgentSpec = {
  name: string;
  photo: string;
  agency: number;
  title: string;
  specialties: PropertyType[];
  purposes: Purpose[];
  areas: string[];
  languages: string[];
  years: number;
  deals: number;
  /** Share of closed deals that were sales. */
  saleShare: number;
  responseMins: number;
  sale?: [number, number];
  rent?: [number, number];
  verification?: Agent["verification"];
  bio: string;
};

const { women: W, men: M } = PORTRAITS;
const CR = 10_000_000; // 1 crore
const K = 1_000;

const specs: AgentSpec[] = [
  { name: "Hamza Qureshi", photo: M[0], agency: 1, title: "Senior Property Consultant",
    specialties: ["house", "villa"], purposes: ["sale", "rent"], areas: ["dha-phase-6", "gulberg"],
    languages: ["English", "Urdu", "Punjabi"], years: 9, deals: 142, saleShare: 0.7, responseMins: 12,
    sale: [4 * CR, 25 * CR], rent: [150 * K, 600 * K],
    bio: "I help families move into DHA and Gulberg without the guesswork. Nine years in, I still walk every house before I list it." },
  { name: "Mahnoor Shah", photo: W[0], agency: 1, title: "Luxury Homes Specialist",
    specialties: ["villa", "house"], purposes: ["sale"], areas: ["dha-phase-6"],
    languages: ["English", "Urdu"], years: 7, deals: 88, saleShare: 1, responseMins: 20,
    sale: [8 * CR, 40 * CR],
    bio: "Villas and one-kanal homes in DHA, with a focus on overseas buyers who need a trusted pair of eyes on the ground." },
  { name: "Usman Tariq", photo: M[1], agency: 1, title: "Rentals Lead",
    specialties: ["apartment", "house"], purposes: ["rent"], areas: ["gulberg", "dha-phase-6"],
    languages: ["English", "Urdu"], years: 4, deals: 210, saleShare: 0, responseMins: 8,
    rent: [60 * K, 350 * K],
    bio: "Corporate leases and family rentals. Most of my tenants have keys within two weeks." },
  { name: "Zainab Hussain", photo: W[1], agency: 2, title: "Apartment Specialist",
    specialties: ["apartment"], purposes: ["sale", "rent"], areas: ["gulberg", "model-town"],
    languages: ["English", "Urdu"], years: 6, deals: 120, saleShare: 0.45, responseMins: 15,
    sale: [1.5 * CR, 6 * CR], rent: [70 * K, 250 * K],
    bio: "High-rise and boutique apartments in central Lahore. I know which buildings have reliable lifts and backup power." },
  { name: "Ali Raza", photo: M[2], agency: 2, title: "Commercial Property Advisor",
    specialties: ["commercial"], purposes: ["sale", "rent"], areas: ["gulberg", "johar-town"],
    languages: ["English", "Urdu", "Punjabi"], years: 12, deals: 95, saleShare: 0.55, responseMins: 35,
    sale: [5 * CR, 60 * CR], rent: [200 * K, 1500 * K],
    bio: "Offices, showrooms and retail on the main boulevards. I work with founders and franchise operators." },
  { name: "Fatima Noor", photo: W[2], agency: 2, title: "Property Consultant",
    specialties: ["house", "apartment"], purposes: ["rent", "sale"], areas: ["model-town", "johar-town"],
    languages: ["Urdu", "Punjabi", "English"], years: 3, deals: 46, saleShare: 0.3, responseMins: 10,
    sale: [2 * CR, 7 * CR], rent: [50 * K, 180 * K],
    bio: "Friendly, fast and honest about a home's flaws. I specialise in 5 to 10 marla family homes." },
  { name: "Omar Farooq", photo: M[3], agency: 3, title: "First-time Buyer Advisor",
    specialties: ["house", "plot"], purposes: ["sale"], areas: ["johar-town", "model-town"],
    languages: ["Urdu", "English"], years: 8, deals: 103, saleShare: 1, responseMins: 25,
    sale: [1.8 * CR, 8 * CR],
    bio: "I walk first-time buyers through every step, from token money to transfer at the society office." },
  { name: "Hira Saeed", photo: W[3], agency: 3, title: "Family Homes Consultant",
    specialties: ["house"], purposes: ["sale", "rent"], areas: ["model-town"],
    languages: ["English", "Urdu"], years: 5, deals: 64, saleShare: 0.6, responseMins: 18,
    sale: [3 * CR, 12 * CR], rent: [80 * K, 300 * K],
    bio: "Born and raised in Model Town. I know the quiet blocks, the good schools and the houses that never come up for sale." },
  { name: "Saad Javed", photo: M[4], agency: 3, title: "Rentals Consultant",
    specialties: ["apartment", "house"], purposes: ["rent"], areas: ["johar-town"],
    languages: ["Urdu", "Punjabi"], years: 2, deals: 58, saleShare: 0, responseMins: 9,
    rent: [40 * K, 150 * K],
    bio: "Student and young-family rentals near UCP and the Expo Centre." },
  { name: "Ayesha Siddiqui", photo: W[4], agency: 4, title: "Plots & Investment Advisor",
    specialties: ["plot", "commercial"], purposes: ["sale"], areas: ["bahria-town", "johar-town"],
    languages: ["English", "Urdu"], years: 10, deals: 170, saleShare: 1, responseMins: 30,
    sale: [80 * 100 * K, 15 * CR],
    bio: "Plot files, possession status and development charges, explained plainly. Investors are my main clients." },
  { name: "Kamran Iqbal", photo: M[5], agency: 4, title: "New Builds Specialist",
    specialties: ["house", "villa"], purposes: ["sale", "rent"], areas: ["bahria-town"],
    languages: ["Urdu", "Punjabi", "English"], years: 6, deals: 77, saleShare: 0.75, responseMins: 22,
    sale: [2 * CR, 9 * CR], rent: [60 * K, 220 * K],
    bio: "Newly built homes in Bahria Town. I coordinate directly with builders on snag lists before handover." },
  { name: "Sara Khan", photo: W[5], agency: 4, title: "Property Consultant",
    specialties: ["apartment", "house"], purposes: ["rent"], areas: ["bahria-town", "johar-town"],
    languages: ["English", "Urdu"], years: 3, deals: 51, saleShare: 0, responseMins: 14,
    rent: [35 * K, 160 * K],
    bio: "Rentals in Bahria and Johar Town, including furnished apartments for overseas visitors." },
  { name: "Danish Mirza", photo: M[6], agency: 5, title: "Senior Consultant",
    specialties: ["house", "villa", "plot"], purposes: ["sale"], areas: ["dha-phase-6", "model-town"],
    languages: ["English", "Urdu"], years: 15, deals: 230, saleShare: 1, responseMins: 40,
    sale: [5 * CR, 30 * CR],
    bio: "Fifteen years across DHA and Model Town. I handle complicated sales: inherited homes, joint owners, overseas sellers." },
  { name: "Maryam Aslam", photo: W[6], agency: 5, title: "Property Consultant",
    specialties: ["apartment", "house"], purposes: ["rent", "sale"], areas: ["bahria-town", "model-town"],
    languages: ["Urdu", "English", "Punjabi"], years: 4, deals: 39, saleShare: 0.4, responseMins: 16,
    sale: [1.5 * CR, 5 * CR], rent: [45 * K, 170 * K],
    bio: "Calm, organised and quick on WhatsApp. I like helping people downsize." },
  { name: "Bilal Haider", photo: M[7], agency: 5, title: "Associate Agent",
    specialties: ["house"], purposes: ["sale", "rent"], areas: ["dha-phase-6"],
    languages: ["English", "Urdu"], years: 1, deals: 9, saleShare: 0.5, responseMins: 11,
    sale: [3 * CR, 10 * CR], rent: [120 * K, 400 * K], verification: "pending",
    bio: "New to Nestly and building my book in DHA. You'll get my full attention." },
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export const agents: Agent[] = specs.map((s, i) => {
  const n = i + 1;
  const saleDeals = Math.round(s.deals * s.saleShare);
  return {
    id: `a-${n}`,
    slug: slugify(s.name),
    userId: n === 1 ? "u-agent" : `u-agent-${n}`,
    agencyId: `ag-${s.agency}`,
    name: s.name,
    photo: portrait(s.photo),
    title: s.title,
    bio: s.bio,
    phone: `+92 300 ${String(4100000 + n * 7919).slice(0, 7)}`,
    email: n === 1 ? "agent@demo.com" : `${slugify(s.name).replace("-", ".")}@nestly.pk`,
    specialties: s.specialties,
    purposes: s.purposes,
    serviceAreas: s.areas.map((a) => `nb-${a}`),
    languages: s.languages,
    // Recomputed from seeded reviews in seed/index.ts.
    rating: 0,
    reviewCount: 0,
    dealsClosed: s.deals,
    dealsByPurpose: { sale: saleDeals, rent: s.deals - saleDeals },
    avgResponseMins: s.responseMins,
    yearsExperience: s.years,
    priceBands: {
      ...(s.sale && { sale: { min: s.sale[0], max: s.sale[1] } }),
      ...(s.rent && { rent: { min: s.rent[0], max: s.rent[1] } }),
    },
    verification: s.verification ?? (s.agency === 5 ? "pending" : "verified"),
    createdAt: daysAgo(30 + s.years * 120),
  };
});
