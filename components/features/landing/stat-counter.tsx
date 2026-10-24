"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

interface Stat {
  value: number;
  label: string;
  suffix?: string;
}

const fmt = (n: number) => Math.round(n).toLocaleString("en-PK");

/**
 * Counts up once when scrolled into view. The number is written straight to `textContent`
 * from rAF (no React re-render per frame), and the box is sized to the final value in `ch`
 * with tabular figures so the count never shifts surrounding layout.
 */
function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const duration = 1400;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - (1 - t) ** 5;
          el.textContent = fmt(value * eased) + suffix;
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    // Rendered with the final value for no-JS and SEO; reset only while still off-screen.
    if (el.getBoundingClientRect().top > window.innerHeight) el.textContent = `0${suffix}`;
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, suffix, reduce]);

  const final = fmt(value) + suffix;
  return (
    <span ref={ref} className="tabular inline-block" style={{ minWidth: `${final.length}ch` }}>
      {final}
    </span>
  );
}

export function StatRow({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid grid-cols-2 gap-y-10 border-t border-hairline pt-10 md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col-reverse pr-6">
          <dt className="mono-label mt-2 text-meta">{s.label}</dt>
          <dd className="font-display text-5xl tracking-[-0.03em] sm:text-6xl">
            <Counter value={s.value} suffix={s.suffix} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
