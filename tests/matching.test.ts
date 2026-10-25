import { describe, expect, it } from "vitest";
import { buildSeed } from "@/lib/data/mock/seed";
import { MATCH_WEIGHTS, rankAgents, scoreAgent, type MatchInput } from "@/lib/matching";
import type { Agent } from "@/lib/data/types";

const { agents } = buildSeed();

const base: MatchInput = { goal: "buy", neighbourhoodId: null, budget: null, timeline: "1-3m", propertyType: null, language: null };

const agent = (over: Partial<Agent>): Agent => ({
  ...agents[0],
  id: "x", serviceAreas: ["nb-gulberg"], specialties: ["apartment"], purposes: ["sale"], languages: ["English"],
  priceBands: { sale: { min: 2e7, max: 6e7 } }, dealsByPurpose: { sale: 75, rent: 0 }, avgResponseMins: 65,
  rating: 4, reviewCount: 4, verification: "verified", ...over,
});

describe("match weights", () => {
  it("add up to 100 so each weight is the most a factor can contribute", () => {
    expect(Object.values(MATCH_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });
});

describe("scoreAgent", () => {
  it("excludes unverified agents and agents who don't handle the goal", () => {
    expect(scoreAgent(agent({ verification: "pending" }), base)).toBeNull();
    expect(scoreAgent(agent({ purposes: ["sale"] }), { ...base, goal: "rent" })).toBeNull();
  });

  it("scores a perfect fit at 100", () => {
    const perfect = agent({ dealsByPurpose: { sale: 150, rent: 0 }, avgResponseMins: 10, rating: 5 });
    const input: MatchInput = { ...base, neighbourhoodId: "nb-gulberg", budget: 3e7, propertyType: "apartment", language: "English" };
    expect(scoreAgent(perfect, input)!.score).toBe(100);
  });

  it("rewards each matching preference", () => {
    const input: MatchInput = { ...base, neighbourhoodId: "nb-gulberg", propertyType: "apartment" };
    const fits = scoreAgent(agent({}), input)!.score;
    const wrongArea = scoreAgent(agent({ serviceAreas: ["nb-dha-phase-6"] }), input)!.score;
    const wrongType = scoreAgent(agent({ specialties: ["villa"] }), input)!.score;
    // Scores are rounded to whole percent, so a difference can be off by one.
    expect(Math.abs(fits - wrongArea - MATCH_WEIGHTS.area)).toBeLessThanOrEqual(1);
    expect(Math.abs(fits - wrongType - MATCH_WEIGHTS.specialty)).toBeLessThanOrEqual(1);
  });

  it("gives partial budget credit outside the agent's band", () => {
    const inBand = scoreAgent(agent({}), { ...base, budget: 4e7 })!.breakdown.budget;
    const double = scoreAgent(agent({}), { ...base, budget: 1.2e8 })!.breakdown.budget;
    expect(inBand).toBe(1);
    expect(double).toBeCloseTo(0.5);
  });

  it("weights responsiveness more heavily when the move is urgent", () => {
    const fast = agent({ avgResponseMins: 10, dealsByPurpose: { sale: 10, rent: 0 } });
    const seasoned = agent({ avgResponseMins: 110, dealsByPurpose: { sale: 150, rent: 0 } });
    const urgent = { ...base, timeline: "asap" as const };
    expect(scoreAgent(fast, urgent)!.score).toBeGreaterThan(scoreAgent(seasoned, urgent)!.score);
  });

  it("explains the match with the strongest reasons first", () => {
    const r = scoreAgent(agent({ avgResponseMins: 8 }), { ...base, neighbourhoodId: "nb-gulberg", propertyType: "apartment" }, "Gulberg III")!;
    expect(r.reasons[0]).toBe("Covers Gulberg III");
    expect(r.reasons).toContain("Specialises in apartments");
    expect(r.reasons.some((x) => x.startsWith("Replies within"))).toBe(true);
  });
});

describe("rankAgents on the seed", () => {
  it("puts DHA villa specialists first for a DHA villa purchase", () => {
    const top = rankAgents(agents, { ...base, neighbourhoodId: "nb-dha-phase-6", propertyType: "villa", budget: 1.5e8 }, "DHA Phase 6", 3);
    expect(top[0].agent.serviceAreas).toContain("nb-dha-phase-6");
    expect(top[0].agent.specialties).toContain("villa");
    expect(top.map((t) => t.score)).toEqual([...top.map((t) => t.score)].sort((a, b) => b - a));
  });

  it("only returns rental agents for renters", () => {
    for (const r of rankAgents(agents, { ...base, goal: "rent" }, undefined, 20)) expect(r.agent.purposes).toContain("rent");
  });
});
