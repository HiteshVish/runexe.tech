import type { MetadataRoute } from "next";
import { COMPRESS_TARGET_SLUGS } from "@/lib/image/target-sizes";
import { PASSWORD_LENGTHS, passwordLandingMeta } from "@/lib/password/length-landings";
import { QR_LANDING_SLUGS, qrLandingMeta } from "@/lib/qr/landing-meta";
import { PDF_LANDING_SLUGS, pdfLandingMeta } from "@/lib/pdf-studio/landing-meta";
import { WORD_LANDING_PATHS } from "@/lib/text/landing-meta";
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
    ...COMPRESS_TARGET_SLUGS.map((size) => ({
      url: `${SITE_URL}/tools/compress-image-to/${size}`,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...QR_LANDING_SLUGS.map((slug) => ({
      url: `${SITE_URL}${qrLandingMeta(slug).path}`,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...PASSWORD_LENGTHS.map((length) => ({
      url: `${SITE_URL}${passwordLandingMeta(length).path}`,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...(["character-counter", "reading-time-calculator"] as const).map((slug) => ({
      url: `${SITE_URL}${WORD_LANDING_PATHS[slug]}`,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...PDF_LANDING_SLUGS.map((slug) => ({
      url: `${SITE_URL}${pdfLandingMeta(slug).path}`,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];
}
