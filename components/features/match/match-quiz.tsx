"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PROPERTY_TYPES } from "@/lib/data/types";
import { typeLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";

export type Answers = Partial<Record<"goal" | "area" | "budget" | "timeline" | "type" | "lang", string>>;

const BUDGETS = {
  sale: [["10000000", "Under 1 Crore"], ["20000000", "1 – 3 Crore"], ["50000000", "3 – 7 Crore"], ["110000000", "7 – 15 Crore"], ["250000000", "15 Crore +"]],
  rent: [["40000", "Under 50k / mo"], ["75000", "50k – 1 Lakh"], ["150000", "1 – 2 Lakh"], ["300000", "2 – 4 Lakh"], ["550000", "4 Lakh +"]],
} as const;

interface Step {
  key: keyof Answers;
  question: string;
  hint?: string;
  options: (a: Answers) => readonly (readonly [string, string])[];
}

const EASE = [0.22, 1, 0.36, 1] as const;

export function MatchQuiz({ initial, areas }: { initial: Answers; areas: { id: string; name: string }[] }) {
  const router = useRouter();
  const steps: Step[] = [
    { key: "goal", question: "What are you looking to do?", options: () => [["buy", "Buy a home"], ["rent", "Rent a home"], ["sell", "Sell my property"]] },
    { key: "area", question: "Which area?", hint: "We'll favour agents who work there.", options: () => [...areas.map((a) => [a.id, a.name] as const), ["", "Anywhere in Lahore"]] },
    { key: "budget", question: initial.goal === "sell" ? "Roughly what is it worth?" : "What's your budget?", options: (a) => [...BUDGETS[a.goal === "rent" ? "rent" : "sale"], ["", "Not sure yet"]] },
    { key: "timeline", question: "When do you want to move?", options: () => [["asap", "As soon as possible"], ["1-3m", "In 1–3 months"], ["3-6m", "In 3–6 months"], ["exploring", "Just exploring"]] },
    { key: "type", question: "What kind of property?", options: () => [...PROPERTY_TYPES.map((t) => [t, typeLabels[t]] as const), ["", "Open to anything"]] },
    { key: "lang", question: "Preferred language?", options: () => [["Urdu", "Urdu"], ["English", "English"], ["Punjabi", "Punjabi"], ["", "No preference"]] },
  ];

  const [answers, setAnswers] = useState<Answers>(initial);
  const [index, setIndex] = useState(() => Math.min(steps.findIndex((s) => !(s.key in initial)), steps.length - 1));
  const [dir, setDir] = useState(1);
  const step = steps[Math.max(0, index)];
  const at = Math.max(0, index);

  const finish = (final: Answers) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(final)) params.set(k, v ?? "");
    params.set("done", "1");
    router.push(`/match?${params}`, { scroll: true });
  };

  const choose = (value: string) => {
    const next = { ...answers, [step.key]: value };
    setAnswers(next);
    if (at === steps.length - 1) return finish(next);
    setDir(1);
    setIndex(at + 1);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-10 flex items-center gap-4">
        <span className="mono-label text-meta">{at + 1} / {steps.length}</span>
        <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-hairline" role="progressbar" aria-valuenow={at + 1} aria-valuemin={1} aria-valuemax={steps.length} aria-label="Quiz progress">
          {/* Progress grows with scaleX, never width. */}
          <span className="absolute inset-0 origin-left rounded-full bg-primary transition-transform duration-500 ease-[var(--ease-out-quint)]" style={{ transform: `scaleX(${(at + 1) / steps.length})` }} />
        </div>
      </div>

      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <motion.fieldset
          key={step.key}
          custom={dir}
          initial={{ opacity: 0, x: dir * 32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -32 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <legend className="font-display text-4xl leading-tight tracking-[-0.02em] sm:text-5xl">{step.question}</legend>
          {step.hint && <p className="mt-3 text-muted-foreground">{step.hint}</p>}
          <div role="radiogroup" className="mt-8 grid gap-3 sm:grid-cols-2">
            {step.options(answers).map(([value, label]) => {
              const selected = answers[step.key] === value;
              return (
                <button key={value || "any"} type="button" role="radio" aria-checked={selected} onClick={() => choose(value)}
                  className={cn("group flex items-center justify-between rounded-xl border px-5 py-4 text-left text-lg transition-colors",
                    selected ? "border-primary bg-secondary" : "border-hairline hover:border-foreground/40")}>
                  {label}
                  <ArrowRight className="size-4 opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />
                </button>
              );
            })}
          </div>
        </motion.fieldset>
      </AnimatePresence>

      <div className="mt-10 flex justify-between">
        <Button variant="ghost" disabled={at === 0} onClick={() => { setDir(-1); setIndex(at - 1); }}>
          <ArrowLeft className="size-4" aria-hidden /> Back
        </Button>
        {at > 1 && <Button variant="outline" onClick={() => finish(answers)}>Skip to results</Button>}
      </div>
    </div>
  );
}
