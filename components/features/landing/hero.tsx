"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type CSSProperties } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { formatResponseTime } from "@/lib/format";
import { SmartSearch } from "./smart-search";

/** Inline vars for the CSS `.enter` / `.enter-mask` entrance (see globals.css). */
const enter = (delay: number, y?: number, x?: number) =>
  ({ "--enter-delay": `${delay}s`, ...(y !== undefined && { "--enter-y": `${y}px` }), ...(x !== undefined && { "--enter-x": `${x}px` }) }) as CSSProperties;

export interface HeroAgent {
  slug: string;
  name: string;
  photo: string;
  agency: string;
  rating: number;
  responseMins: number;
  specialty: string;
}

interface HeroProps {
  liveCount: number;
  city: string;
  places: { id: string; name: string; count: number }[];
  agents: HeroAgent[];
  image: string;
}

const LINES = ["Find the home", "that fits your life."];

export function Hero({ liveCount, city, places, agents, image }: HeroProps) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: mediaRef, offset: ["start end", "end start"] });
  // Parallax via translateY on an oversized layer: transform-only, no layout or paint.
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:px-8">
      <div className="mx-auto max-w-5xl text-center">
        <p className="enter mono-label mb-6 text-meta" style={enter(0, 8)}>
          {city} · {liveCount} homes live now
        </p>
        <h1 className="text-[3.25rem] sm:text-7xl lg:text-[6rem]">
          {LINES.map((line, i) => (
            // Each line slides up from behind an overflow mask.
            <span key={line} className="block overflow-hidden pb-[0.08em]">
              <span className="enter-mask block" style={enter(0.1 + i * 0.1)}>
                {line}
              </span>
            </span>
          ))}
        </h1>
        {/* The page's LCP element: it rises into place but stays opaque. */}
        <p className="enter mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground" style={{ ...enter(0.3), "--enter-opacity": 1 } as CSSProperties}>
          Rent or buy across five neighbourhoods, with verified listings and agents who know every street.
        </p>
      </div>

      <div className="enter relative z-20 mx-auto mt-10 max-w-5xl" style={enter(0.4, 20)}>
        <SmartSearch places={places} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <div
          ref={mediaRef}
          className="enter relative aspect-[4/3] overflow-hidden rounded-media bg-muted sm:aspect-[16/9] lg:col-span-8 lg:aspect-auto lg:min-h-[480px]"
          style={enter(0.5, 24)}
        >
          <motion.div className="absolute inset-x-0 -inset-y-[8%]" style={{ y }}>
            <Image
              src={image}
              alt="A modern family home with floor-to-ceiling windows at dusk"
              fill
              priority
              sizes="(min-width: 1024px) 66vw, 100vw"
              className="object-cover"
            />
          </motion.div>
          <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-xs text-[#17171c] backdrop-blur">
            DHA Phase 6 · Verified listing
          </div>
        </div>

        <aside
          aria-label="Agents replying fastest this week"
          className="enter flex flex-col rounded-media bg-brand p-6 text-brand-foreground lg:col-span-4"
          style={enter(0.6, 24)}
        >
          <div className="flex items-center justify-between">
            <p className="mono-label text-white/60">Agent matches</p>
            <span className="inline-flex items-center gap-1.5 text-xs text-white/70">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#9fe8c8] opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-[#9fe8c8]" />
              </span>
              Online now
            </span>
          </div>
          <p className="mt-4 text-2xl leading-tight tracking-[-0.01em]">Agents replying fastest this week</p>
          <ul className="mt-6 flex-1 space-y-2">
            {agents.map((a, i) => (
              <li key={a.slug} className="enter" style={enter(0.8 + i * 0.1, 0, 16)}>
                <Link href={`/agents/${a.slug}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 transition-colors hover:bg-white/[0.09]">
                  <Image src={a.photo} alt="" width={44} height={44} className="size-11 rounded-full object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{a.name}</span>
                    <span className="block truncate text-xs text-white/60">{a.agency} · {a.specialty}</span>
                  </span>
                  <span className="text-right text-xs text-white/70">
                    <span className="flex items-center justify-end gap-1 text-white"><Star className="size-3 fill-current" aria-hidden />{a.rating.toFixed(1)}</span>
                    {formatResponseTime(a.responseMins)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/match" className="group mt-6 inline-flex items-center gap-2 text-sm underline underline-offset-4">
            Find my agent
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
          </Link>
        </aside>
      </div>
    </section>
  );
}
