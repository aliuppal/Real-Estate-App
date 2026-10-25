import type { Metadata } from "next";
import { repo, PROPERTY_TYPES, type PropertyType } from "@/lib/data";
import { rankAgents, type MatchGoal, type MatchInput, type MatchTimeline } from "@/lib/matching";
import { formatPrice } from "@/lib/format";
import { typeLabels } from "@/lib/labels";
import { getCurrentUser } from "@/lib/auth/session";
import { MatchQuiz, type Answers } from "@/components/features/match/match-quiz";
import { MatchResults } from "@/components/features/match/match-results";

export const metadata: Metadata = {
  title: "Find my agent",
  description: "Six quick questions, then agents ranked by how well they fit your move, with the reasons why.",
};

type Props = { searchParams: Promise<Record<string, string | undefined>> };

const GOALS: MatchGoal[] = ["buy", "rent", "sell"];
const TIMELINES: MatchTimeline[] = ["asap", "1-3m", "3-6m", "exploring"];
const TIMELINE_LABEL: Record<MatchTimeline, string> = { asap: "ASAP", "1-3m": "1–3 months", "3-6m": "3–6 months", exploring: "Exploring" };

export default async function MatchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [neighbourhoods, agents, agencies, user] = await Promise.all([
    repo.neighbourhoods.list(), repo.agents.list(), repo.agencies.list(), getCurrentUser(),
  ]);
  const areaNames = Object.fromEntries(neighbourhoods.map((n) => [n.id, n.name]));

  // Only known values survive from the URL.
  const answers: Answers = {};
  if (sp.goal && GOALS.includes(sp.goal as MatchGoal)) answers.goal = sp.goal;
  for (const key of ["area", "budget", "timeline", "type", "lang"] as const) if (sp[key] !== undefined) answers[key] = sp[key];

  if (sp.done !== "1" || !answers.goal) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <p className="mono-label mb-6 text-center text-meta">Find my agent</p>
        <MatchQuiz initial={answers} areas={neighbourhoods.map((n) => ({ id: n.id, name: n.name }))} />
      </section>
    );
  }

  const input: MatchInput = {
    goal: answers.goal as MatchGoal,
    neighbourhoodId: answers.area && areaNames[answers.area] ? answers.area : null,
    budget: Number(answers.budget) > 0 ? Number(answers.budget) : null,
    timeline: TIMELINES.includes(answers.timeline as MatchTimeline) ? (answers.timeline as MatchTimeline) : "exploring",
    propertyType: PROPERTY_TYPES.includes(answers.type as PropertyType) ? (answers.type as PropertyType) : null,
    language: ["Urdu", "English", "Punjabi"].includes(answers.lang ?? "") ? answers.lang! : null,
  };
  const area = input.neighbourhoodId ? areaNames[input.neighbourhoodId] : undefined;
  const results = rankAgents(agents, input, area, 6);

  const summary = [
    { buy: "Buying", rent: "Renting", sell: "Selling" }[input.goal],
    area ?? "Anywhere in Lahore",
    input.budget ? `~${formatPrice(input.budget, { compact: true, purpose: input.goal === "rent" ? "rent" : "sale" })}` : null,
    input.propertyType ? typeLabels[input.propertyType] : null,
    TIMELINE_LABEL[input.timeline],
    input.language,
  ].filter((s): s is string => !!s);

  const editParams = new URLSearchParams(Object.entries(answers).map(([k, v]) => [k, v ?? ""]));
  const draft = `Hi, I'm ${summary[0].toLowerCase()}${input.propertyType ? ` a ${typeLabels[input.propertyType].toLowerCase()}` : ""} ${area ? `in ${area}` : "in Lahore"}${input.budget ? ` around ${formatPrice(input.budget, { compact: true })}` : ""}. Nestly matched us; could you help?`;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <MatchResults
        results={results}
        summary={summary}
        editHref={`/match?${editParams}`}
        agencyNames={Object.fromEntries(agencies.map((a) => [a.id, a.name]))}
        areaNames={areaNames}
        signedIn={!!user}
        draft={draft}
      />
    </section>
  );
}
