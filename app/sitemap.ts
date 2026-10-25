import type { MetadataRoute } from "next";
import { repo } from "@/lib/data";
import { site } from "@/config/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, agents, agencies] = await Promise.all([repo.listings.all(), repo.agents.list(), repo.agencies.list()]);
  const url = (path: string) => `${site.url}${path}`;
  const now = new Date();

  return [
    { url: url("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: url("/search"), lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: url("/search?purpose=sale"), lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: url("/search?purpose=rent"), lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: url("/match"), changeFrequency: "monthly", priority: 0.6 },
    { url: url("/agents"), changeFrequency: "weekly", priority: 0.6 },
    { url: url("/agencies"), changeFrequency: "weekly", priority: 0.5 },
    ...listings
      .filter((l) => l.status === "active" || l.status === "under_offer")
      .map((l) => ({ url: url(`/listings/${l.id}`), lastModified: new Date(l.updatedAt), changeFrequency: "daily" as const, priority: 0.7 })),
    ...agents.filter((a) => a.verification === "verified").map((a) => ({ url: url(`/agents/${a.slug}`), changeFrequency: "weekly" as const, priority: 0.5 })),
    ...agencies.filter((a) => a.verification === "verified").map((a) => ({ url: url(`/agencies/${a.slug}`), changeFrequency: "weekly" as const, priority: 0.5 })),
  ];
}
