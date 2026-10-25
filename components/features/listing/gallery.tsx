"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Grid2x2, Images, LayoutPanelTop, PlayCircle, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Tab = "photos" | "plan" | "video";

interface GalleryProps {
  images: string[];
  title: string;
  floorPlan: string | null;
  videoUrl: string | null;
}

/** Photo mosaic with a keyboard-driven lightbox, plus floor-plan and video-tour tabs. */
export function Gallery({ images, title, floorPlan, videoUrl }: GalleryProps) {
  const [tab, setTab] = useState<Tab>("photos");
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const count = images.length;

  const show = (i: number) => { setIndex(i); setOpen(true); };
  const step = useCallback((dir: 1 | -1) => setIndex((i) => (i + dir + count) % count), [count]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step]);

  const tabs: { id: Tab; label: string; icon: typeof Images }[] = [
    { id: "photos", label: `Photos (${count})`, icon: Images },
    { id: "plan", label: "Floor plan", icon: LayoutPanelTop },
    { id: "video", label: "Video tour", icon: PlayCircle },
  ];

  return (
    <section aria-label="Photos and media">
      <div role="tablist" aria-label="Media" className="mb-3 inline-flex rounded-full border border-hairline p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={cn("relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm", tab === id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
            {tab === id && <motion.span layoutId="media-tab" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
            <Icon className="relative size-4" aria-hidden /><span className="relative">{label}</span>
          </button>
        ))}
      </div>

      {tab === "photos" && (
        <div className="relative grid h-[min(62vh,560px)] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-media">
          {images.slice(0, 5).map((src, i) => (
            <button key={src + i} type="button" onClick={() => show(i)} aria-label={`Open photo ${i + 1} of ${count}`}
              className={cn("group relative overflow-hidden bg-muted", i === 0 ? "col-span-4 row-span-2 md:col-span-2" : "hidden md:block")}>
              <Image src={src} alt={i === 0 ? title : ""} fill priority={i === 0} sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "25vw"}
                className="object-cover transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:scale-[1.03]" />
            </button>
          ))}
          <button type="button" onClick={() => show(0)}
            className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-[#17171c] shadow-md hover:bg-white/90">
            <Grid2x2 className="size-4" aria-hidden /> Show all {count} photos
          </button>
        </div>
      )}

      {tab !== "photos" && (
        <div className="grid h-[min(62vh,560px)] place-items-center rounded-media bg-muted px-6 text-center">
          {tab === "plan" && floorPlan ? (
            <Image src={floorPlan} alt={`Floor plan of ${title}`} width={1200} height={800} className="max-h-full w-auto object-contain" />
          ) : tab === "video" && videoUrl ? (
            <iframe src={videoUrl} title={`Video tour of ${title}`} className="size-full rounded-media" allow="fullscreen; picture-in-picture" />
          ) : (
            <div className="max-w-sm">
              <p className="mono-label text-meta">{tab === "plan" ? "Floor plan" : "Video / 3D tour"}</p>
              <p className="mt-3 text-xl">Not added yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {tab === "plan" ? "Ask the lister for a floor plan using the message button." : "Ask for a video walkthrough, or book a viewing to see it in person."}
              </p>
            </div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="flex h-dvh w-screen max-w-none flex-col gap-0 rounded-none border-0 bg-[#0b0b0d] p-0 text-white sm:max-w-none">
          <DialogTitle className="sr-only">Photos of {title}</DialogTitle>
          <div className="flex items-center justify-between px-5 py-4">
            <p className="tabular text-sm text-white/70" aria-live="polite">{index + 1} / {count}</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close photos" className="grid size-10 place-items-center rounded-full hover:bg-white/10">
              <X className="size-5" />
            </button>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden">
            {/* The whole strip slides with one transform; each slide is a full-width frame. */}
            <div className="flex h-full transition-transform duration-500 ease-[var(--ease-out-quint)]" style={{ transform: `translateX(-${index * 100}%)` }}>
              {images.map((src, i) => (
                <div key={src + i} className="relative h-full w-full shrink-0">
                  {Math.abs(i - index) <= 1 && <Image src={src} alt={`${title}, photo ${i + 1}`} fill sizes="100vw" className="object-contain" />}
                </div>
              ))}
            </div>
            {([-1, 1] as const).map((dir) => (
              <button key={dir} type="button" onClick={() => step(dir)} aria-label={dir === 1 ? "Next photo" : "Previous photo"}
                className={cn("absolute top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 backdrop-blur hover:bg-white/20", dir === 1 ? "right-4" : "left-4")}>
                {dir === 1 ? <ChevronRight className="size-6" /> : <ChevronLeft className="size-6" />}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto px-5 py-4 [scrollbar-width:none]">
            {images.map((src, i) => (
              <button key={src + i} type="button" onClick={() => setIndex(i)} aria-label={`Go to photo ${i + 1}`} aria-current={i === index}
                className={cn("relative h-14 w-20 shrink-0 overflow-hidden rounded-md transition-opacity", i === index ? "opacity-100 ring-2 ring-white" : "opacity-50 hover:opacity-80")}>
                <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
