import type { Metadata } from "next";
import { Map } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Search homes" };

export default function SearchPage() {
  return (
    <ComingSoon
      icon={Map}
      title="Search with a live map"
      description="Split list and map view, clustered price pins, draw-to-search, every filter and saved-search alerts."
    />
  );
}
