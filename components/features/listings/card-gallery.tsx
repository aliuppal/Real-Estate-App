"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardGalleryProps {
  images: string[];
  alt: string;
  priority?: boolean;
  sizes: string;
}

/**
 * Card image carousel. The strip moves with translateX (compositor-only). Only the current and next
 * images are mounted until the user starts browsing, so a grid of cards doesn't load every photo.
 */
export function CardGallery({ images, alt, priority, sizes }: CardGalleryProps) {
  const [index, setIndex] = useState(0);
  const [browsed, setBrowsed] = useState(false);
  const startX = useRef<number | null>(null);
  const count = Math.min(images.length, 6);

  const go = (dir: 1 | -1, e?: React.SyntheticEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setBrowsed(true);
    setIndex((i) => (i + dir + count) % count);
  };

  return (
    <div
      className="group/gallery relative size-full touch-pan-y"
      onPointerDown={(e) => { if (e.pointerType !== "mouse") startX.current = e.clientX; }}
      onPointerUp={(e) => {
        if (startX.current === null) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      }}
    >
      <div
        className="flex size-full transition-transform duration-500 ease-[var(--ease-out-quint)]"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.slice(0, count).map((src, i) => (
          <div key={src + i} className="relative size-full shrink-0 overflow-hidden">
            {(i <= 1 || browsed) && (
              <Image
                src={src}
                alt={i === 0 ? alt : `${alt}, photo ${i + 1}`}
                fill
                priority={priority && i === 0}
                sizes={sizes}
                className="object-cover transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:scale-[1.04]"
              />
            )}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          {([-1, 1] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={(e) => go(dir, e)}
              aria-label={dir === 1 ? "Next photo" : "Previous photo"}
              className={cn(
                "absolute top-1/2 z-20 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#17171c] opacity-0 transition-opacity duration-200 hover:bg-white focus-visible:opacity-100 group-hover/gallery:opacity-100",
                dir === 1 ? "right-3" : "left-3",
              )}
            >
              {dir === 1 ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </button>
          ))}
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1" aria-hidden>
            {Array.from({ length: count }, (_, i) => (
              <span key={i} className={cn("size-1.5 rounded-full bg-white transition-opacity duration-300", i === index ? "opacity-100" : "opacity-50")} />
            ))}
          </div>
          <span className="sr-only" aria-live="polite">Photo {index + 1} of {count}</span>
        </>
      )}
    </div>
  );
}
