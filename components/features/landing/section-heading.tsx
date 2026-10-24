import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  tone?: "default" | "inverse";
}

/** Mono eyebrow, large light-weight heading, optional lead and trailing action. */
export function SectionHeading({ eyebrow, title, description, action, className, tone = "default" }: SectionHeadingProps) {
  const inverse = tone === "inverse";
  return (
    <Reveal className={cn("mb-12 flex flex-wrap items-end justify-between gap-6", className)}>
      <div className="max-w-2xl">
        <p className={cn("mono-label mb-4", inverse ? "text-white/60" : "text-meta")}>{eyebrow}</p>
        <h2 className="text-[2.25rem] leading-[1.1] sm:text-5xl sm:leading-[1.1]">{title}</h2>
        {description && (
          <p className={cn("mt-4 text-lg leading-relaxed", inverse ? "text-white/75" : "text-muted-foreground")}>{description}</p>
        )}
      </div>
      {action}
    </Reveal>
  );
}
