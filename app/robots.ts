import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

// Search and AI crawlers, including model-training crawlers, may read the
// public pages. API routes are not content and are excluded for everyone.
const NAMED_BOTS = [
  "Googlebot",
  "Bingbot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "ClaudeBot",
  "Claude-SearchBot",
  "Applebot",
  "Applebot-Extended",
  "DuckDuckBot",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  const rule = { allow: "/", disallow: "/api/" };
  return {
    rules: [{ userAgent: "*", ...rule }, { userAgent: NAMED_BOTS, ...rule }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
