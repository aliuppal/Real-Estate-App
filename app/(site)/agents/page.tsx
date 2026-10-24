import type { Metadata } from "next";
import { UsersRound } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Agents" };

export default function AgentsPage() {
  return (
    <ComingSoon
      icon={UsersRound}
      title="Agent directory"
      description="Filter agents by area, specialty and language, then compare ratings, deals closed and response times."
    />
  );
}
