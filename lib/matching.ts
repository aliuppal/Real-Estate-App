import type { Agent, PropertyType, Purpose } from "@/lib/data/types";
import { formatPrice, formatResponseTime } from "@/lib/format";
import { typeLabels } from "@/lib/labels";

/**
 * Agent matching. Each factor scores 0–1, is multiplied by its weight, and the weighted sum is the
 * match percentage. Weights add up to 100 so a factor's weight is the most it can contribute.
 */
export type MatchGoal = "buy" | "rent" | "sell";
export type MatchTimeline = "asap" | "1-3m" | "3-6m" | "exploring";

export interface MatchInput {
  goal: MatchGoal;
  neighbourhoodId: string | null;
  /** Purchase price, monthly rent, or expected sale price, depending on the goal. */
  budget: number | null;
  timeline: MatchTimeline;
  propertyType: PropertyType | null;
  language: string | null;
}

export const MATCH_WEIGHTS = {
  area: 25,
  budget: 20,
  specialty: 15,
  experience: 15,
  language: 10,
  responsiveness: 10,
  rating: 5,
} as const;

type Factor = keyof typeof MATCH_WEIGHTS;

/** For urgent moves, responsiveness counts for more and track record for less. */
function weightsFor(timeline: MatchTimeline): Record<Factor, number> {
  return timeline === "asap"
    ? { ...MATCH_WEIGHTS, responsiveness: 18, experience: 7 }
    : { ...MATCH_WEIGHTS };
}

/** Neutral score for "no preference", so it neither helps nor hurts anyone. */
const NEUTRAL = 0.5;
const clamp = (n: number) => Math.max(0, Math.min(1, n));

export const purposeFor = (goal: MatchGoal): Purpose => (goal === "rent" ? "rent" : "sale");

export interface MatchResult {
  agent: Agent;
  /** 0–100. */
  score: number;
  /** Plain-language reasons, strongest first. */
  reasons: string[];
  breakdown: Record<Factor, number>;
}

export function scoreAgent(agent: Agent, input: MatchInput, areaName?: string): MatchResult | null {
  const purpose = purposeFor(input.goal);
  if (agent.verification !== "verified" || !agent.purposes.includes(purpose)) return null;

  const band = agent.priceBands[purpose];
  const deals = agent.dealsByPurpose[purpose];

  const s: Record<Factor, number> = {
    area: input.neighbourhoodId ? Number(agent.serviceAreas.includes(input.neighbourhoodId)) : NEUTRAL,
    budget: !input.budget || !band
      ? NEUTRAL
      : input.budget < band.min ? clamp(input.budget / band.min)
      : input.budget > band.max ? clamp(band.max / input.budget)
      : 1,
    specialty: input.propertyType ? Number(agent.specialties.includes(input.propertyType)) : NEUTRAL,
    experience: clamp(deals / 150),
    language: input.language ? Number(agent.languages.includes(input.language)) : NEUTRAL,
    // 10 min or faster scores 1; two hours or slower scores 0.
    responsiveness: clamp((120 - agent.avgResponseMins) / 110),
    rating: clamp(agent.rating / 5),
  };

  const weights = weightsFor(input.timeline);
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const score = Math.round((Object.keys(s) as Factor[]).reduce((sum, f) => sum + s[f] * weights[f], 0) / total * 100);

  const verb = input.goal === "rent" ? "rentals" : input.goal === "sell" ? "sales" : "sales";
  const candidates: [Factor, string | null][] = [
    ["area", s.area === 1 && areaName ? `Covers ${areaName}` : null],
    ["specialty", s.specialty === 1 && input.propertyType ? `Specialises in ${typeLabels[input.propertyType].toLowerCase()}s` : null],
    ["budget", s.budget === 1 && band ? `Works in your budget (${formatPrice(band.min, { compact: true })} – ${formatPrice(band.max, { compact: true })})` : null],
    ["experience", s.experience >= 0.5 ? `Closed ${deals} ${verb}` : null],
    ["responsiveness", s.responsiveness >= 0.8 ? `Replies ${formatResponseTime(agent.avgResponseMins)}` : null],
    ["language", s.language === 1 && input.language ? `Speaks ${input.language}` : null],
    ["rating", agent.rating >= 4.5 && agent.reviewCount > 0 ? `Rated ${agent.rating.toFixed(1)} by ${agent.reviewCount} clients` : null],
  ];
  const reasons = candidates
    .filter((c): c is [Factor, string] => c[1] !== null)
    .sort((a, b) => s[b[0]] * weights[b[0]] - s[a[0]] * weights[a[0]])
    .map(([, r]) => r);

  return { agent, score, reasons, breakdown: s };
}

/** Ranks eligible agents best-first; ties go to the agent with more deals. */
export function rankAgents(agents: Agent[], input: MatchInput, areaName?: string, limit = 6): MatchResult[] {
  return agents
    .map((a) => scoreAgent(a, input, areaName))
    .filter((r): r is MatchResult => r !== null)
    .sort((a, b) => b.score - a.score || b.agent.dealsClosed - a.agent.dealsClosed)
    .slice(0, limit);
}
