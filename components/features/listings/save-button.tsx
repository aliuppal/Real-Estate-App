"use client";

import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useSaved } from "@/hooks/use-saved";
import { cn } from "@/lib/utils";

/**
 * Heart toggle. On save the icon pops (scale) and a ring bursts outward (scale + opacity):
 * transform and opacity only, so it stays on the compositor.
 */
export function SaveButton({ listingId, className, tone = "overlay" }: { listingId: string; className?: string; tone?: "overlay" | "plain" }) {
  const { state, isSaved, toggle } = useSaved();
  const router = useRouter();
  const pathname = usePathname();
  const saved = isSaved(listingId);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!state?.signedIn) return router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    if (!state.canSave) return toast("Saving homes is for seeker accounts.");
    toggle(listingId);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved homes" : "Save this home"}
      className={cn(
        "relative z-20 grid size-10 place-items-center rounded-full transition-colors",
        tone === "overlay" ? "bg-white/90 text-[#17171c] backdrop-blur hover:bg-white" : "border border-hairline hover:bg-muted",
        className,
      )}
    >
      <AnimatePresence>
        {saved && (
          <motion.span
            key="burst"
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-cta"
            initial={{ scale: 0.6, opacity: 0.9 }}
            animate={{ scale: 1.6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </AnimatePresence>
      <motion.span
        key={saved ? "on" : "off"}
        initial={{ scale: saved ? 0.6 : 1 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 520, damping: 14 }}
        className="grid place-items-center"
      >
        <Heart className={cn("size-[1.1rem]", saved && "fill-cta text-cta")} strokeWidth={1.8} />
      </motion.span>
    </button>
  );
}
