import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Agencies" };

export default function AgenciesPage() {
  return (
    <ComingSoon
      icon={Building2}
      title="Agency directory"
      description="Every verified agency with its team, active listings and reviews."
    />
  );
}
