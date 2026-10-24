import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Find my agent" };

export default function MatchPage() {
  return (
    <ComingSoon
      icon={Sparkles}
      title="Find my agent"
      description="Answer six quick questions and get agents ranked by match score, with the reasons behind each match."
    />
  );
}
