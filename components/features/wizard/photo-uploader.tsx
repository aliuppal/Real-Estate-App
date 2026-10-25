"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { unsplash } from "@/lib/images";
import { cn } from "@/lib/utils";

const SAMPLES = ["1600596542815-ffad4c1539a9", "1600607687939-ce8a6c25118c", "1600566753190-17f0baa2a6c3", "1556909114-f6e7ad7d3136"];

/** Drag-and-drop upload, reorder, and pick a cover (the first photo). */
export function PhotoUploader({ value, onChange }: { value: string[]; onChange: (urls: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const upload = async (files: FileList | File[]) => {
    const list = [...files].slice(0, 30 - value.length);
    setUploading(list.length);
    const urls: string[] = [];
    for (const file of list) {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.url) urls.push(json.url);
      else toast.error(`${file.name}: ${json.error ?? "upload failed"}`);
      setUploading((n) => n - 1);
    }
    if (urls.length) onChange([...value, ...urls]);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files.length) void upload(e.dataTransfer.files); }}
        className={cn("flex flex-col items-center rounded-media border-2 border-dashed px-6 py-10 text-center transition-colors", over ? "border-primary bg-secondary" : "border-hairline")}
      >
        <ImagePlus className="size-8 text-meta" strokeWidth={1.4} aria-hidden />
        <p className="mt-3">Drag photos here, or</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={() => input.current?.click()}>Choose files</Button>
          <Button type="button" variant="outline" onClick={() => onChange([...value, ...SAMPLES.map((id) => unsplash(id)).filter((u) => !value.includes(u))])}>Use sample photos</Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">JPG, PNG, WebP or AVIF up to 8 MB each. The first photo is the cover.</p>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={(e) => e.target.files && void upload(e.target.files)} />
        {uploading > 0 && <p className="mt-3 text-sm" role="status">Uploading {uploading}…</p>}
      </div>

      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((src, i) => (
            <li key={src} draggable onDragStart={() => setDragIndex(i)} onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragIndex !== null) move(dragIndex, i); setDragIndex(null); }}
              className={cn("group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted", i === 0 && "ring-2 ring-primary")}>
              <Image src={src} alt={`Photo ${i + 1}`} fill sizes="25vw" className="object-cover" />
              {i === 0 && <span className="mono-label absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-[0.625rem] text-[#17171c]">Cover</span>}
              <div className="absolute inset-x-2 bottom-2 flex justify-between gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                <span className="flex gap-1">
                  <button type="button" aria-label="Move earlier" onClick={() => move(i, i - 1)} className="grid size-7 place-items-center rounded-full bg-white/90 text-[#17171c]"><ArrowLeft className="size-3.5" /></button>
                  <button type="button" aria-label="Move later" onClick={() => move(i, i + 1)} className="grid size-7 place-items-center rounded-full bg-white/90 text-[#17171c]"><ArrowRight className="size-3.5" /></button>
                  {i > 0 && <button type="button" aria-label="Set as cover" onClick={() => move(i, 0)} className="grid size-7 place-items-center rounded-full bg-white/90 text-[#17171c]"><Star className="size-3.5" /></button>}
                </span>
                <button type="button" aria-label="Remove photo" onClick={() => onChange(value.filter((_, j) => j !== i))} className="grid size-7 place-items-center rounded-full bg-white/90 text-[#17171c]"><X className="size-3.5" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
