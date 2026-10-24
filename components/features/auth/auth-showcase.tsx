"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { unsplash } from "@/lib/images";

const EASE = [0.22, 1, 0.36, 1] as const;

const SLIDES = [
  {
    image: "1600585154340-be6161a56a0c",
    alt: "Contemporary home with a lawn at golden hour",
    quote: "We saw nine houses in one weekend, and our agent had already flagged the two with drainage problems.",
    name: "Faisal & Amna",
    detail: "Bought in DHA Phase 6",
  },
  {
    image: "1600607687939-ce8a6c25118c",
    alt: "Bright open-plan living room with large windows",
    quote: "Listed on a Monday, three serious viewings by Thursday. The suggested price was spot on.",
    name: "Rabia Anwar",
    detail: "Sold in Model Town",
  },
  {
    image: "1522708323590-d24dbb6b0267",
    alt: "Furnished apartment with a sofa and warm lighting",
    quote: "Found a furnished flat near work in Gulberg without a single wasted trip.",
    name: "Junaid Akhtar",
    detail: "Renting in Gulberg III",
  },
];

/**
 * Right-hand media card of the auth split screen. Slides cross-fade with opacity and a slight
 * scale (transform), so each transition stays on the compositor.
 */
export function AuthShowcase() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 6500);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const slide = SLIDES[index];
  return (
    <div className="relative h-full overflow-hidden rounded-media bg-muted">
      <AnimatePresence initial={false}>
        <motion.div
          key={slide.image}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: EASE }}
        >
          <Image src={unsplash(slide.image, 1600)} alt={slide.alt} fill priority={index === 0} sizes="50vw" className="object-cover" />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" aria-hidden />

      <figure className="absolute inset-x-0 bottom-0 p-10 text-white">
        <AnimatePresence mode="wait">
          <motion.div key={slide.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.5, ease: EASE }} aria-live="polite">
            <blockquote className="text-2xl leading-snug tracking-[-0.01em] xl:text-3xl">“{slide.quote}”</blockquote>
            <figcaption className="mt-5 text-sm">
              <span>{slide.name}</span>
              <span className="text-white/70"> · {slide.detail}</span>
            </figcaption>
          </motion.div>
        </AnimatePresence>
        <div className="mt-6 flex gap-2" role="group" aria-label="Choose a story">
          {SLIDES.map((s, i) => (
            <button
              key={s.image}
              type="button"
              aria-pressed={i === index}
              aria-label={`Story ${i + 1}: ${s.name}`}
              onClick={() => setIndex(i)}
              className="relative h-1 w-10 overflow-hidden rounded-full bg-white/35"
            >
              <span
                className="absolute inset-0 origin-left bg-white transition-transform duration-500 ease-[var(--ease-out-quint)]"
                style={{ transform: `scaleX(${i === index ? 1 : 0})` }}
              />
            </button>
          ))}
        </div>
      </figure>
    </div>
  );
}
