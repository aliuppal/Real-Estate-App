"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const STEPS = {
  seekers: [
    { title: "Search the way you talk", body: "Type what you want in plain English, or draw the area on the map. We turn it into filters." },
    { title: "Shortlist and compare", body: "Save homes into collections, compare up to four side by side, and get alerts when new ones match." },
    { title: "View, then move in", body: "Book viewings from agents' real availability, then make an offer or apply to rent online." },
  ],
  sellers: [
    { title: "List in minutes", body: "A guided listing flow with a suggested price range from comparable homes nearby." },
    { title: "Get matched with agents", body: "Prefer help? Hand your listing over and matched agents pitch for it." },
    { title: "Track every enquiry", body: "See views, saves and enquiries as they happen, and reply from one inbox." },
  ],
} as const;

type Audience = keyof typeof STEPS;

export function HowItWorks() {
  const [audience, setAudience] = useState<Audience>("seekers");

  return (
    <div>
      <div role="tablist" aria-label="How it works for" className="mb-12 inline-flex rounded-full border border-hairline p-1">
        {(["seekers", "sellers"] as const).map((a) => (
          <button
            key={a}
            type="button"
            role="tab"
            aria-selected={audience === a}
            onClick={() => setAudience(a)}
            className={cn(
              "relative rounded-full px-5 py-2 text-sm transition-colors duration-200",
              audience === a ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {audience === a && (
              <motion.span layoutId="how-tab" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 420, damping: 36 }} />
            )}
            <span className="relative">{a === "seekers" ? "Renting or buying" : "Selling or letting"}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {/* The tabpanel role sits on a wrapper so the <ol> keeps its list semantics. */}
        <motion.div key={audience} role="tabpanel" initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
        <motion.ol
          className="grid gap-10 md:grid-cols-3 md:gap-8"
          initial="hidden"
          animate="show"
          exit="exit"
          variants={{ show: { transition: { staggerChildren: 0.08 } }, exit: { opacity: 0, transition: { duration: 0.15 } } }}
        >
          {STEPS[audience].map((step, i) => (
            <motion.li
              key={step.title}
              className="border-t border-hairline pt-6"
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}
            >
              <p className="mono-label text-meta">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-6 text-2xl leading-snug">{step.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{step.body}</p>
            </motion.li>
          ))}
        </motion.ol>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
