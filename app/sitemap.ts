import type { MetadataRoute } from "next";
import { SITE_URL, TOOLS } from "@/lib/seo/site";

// lastModified is omitted on purpose: there is no reliable per-page edit date
// at build time, and a fake date is worse than none.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/projects`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/tools`, changeFrequency: "monthly", priority: 0.9 },
    ...Object.values(TOOLS).map((t) => ({
      url: `${SITE_URL}${t.path}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
