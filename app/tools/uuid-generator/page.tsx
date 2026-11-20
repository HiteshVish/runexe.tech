import UuidGeneratorApp from "@/components/tools/UuidGeneratorApp";
import JsonLd, { faqPage, graph, toolApp } from "@/components/seo/JsonLd";
import ToolGuide, { type GuideFaq, type GuideSection } from "@/components/seo/ToolGuide";
import { SITE_URL, pageMetadata } from "@/lib/seo/site";

const description =
  "Generate random UUID v4 values online, from one to 1,000 at a time, with uppercase, no-hyphen and brace options. Created in your browser.";

export const metadata = pageMetadata({
  title: "UUID Generator — Random v4 UUIDs in Bulk | RunExe",
  description,
  path: "/tools/uuid-generator",
});

const sections: GuideSection[] = [
  {
    heading: "What it does",
    body: "Creates version 4 (random) UUIDs using crypto.getRandomValues, the browser's cryptographically secure random number generator. Each UUID has 122 random bits.",
  },
  {
    heading: "How to use it",
    ordered: true,
    list: [
      "Enter how many UUIDs you need (1 to 1,000).",
      "Choose uppercase, hyphens and braces to match your code style.",
      "Press Generate, then Copy all. Each UUID is on its own line.",
    ],
  },
  {
    heading: "Common uses",
    list: [
      "Primary keys and public IDs in databases",
      "Idempotency keys for API requests",
      "Test fixtures and seed data",
      "Correlation IDs in logs",
    ],
  },
  {
    heading: "Privacy",
    body: "UUIDs are generated in your browser tab. Nothing is sent to a server or stored.",
  },
  {
    heading: "Limitations",
    list: [
      "Only version 4 UUIDs are generated. Time-ordered versions such as v7 are not offered yet.",
      "Up to 1,000 UUIDs per click.",
    ],
  },
];

const faq: GuideFaq[] = [
  {
    q: "Are these UUIDs unique?",
    a: "They are random, not centrally registered. With 122 random bits the chance of a collision is so small that v4 UUIDs are treated as unique in practice.",
  },
  {
    q: "What is the difference between a UUID and a GUID?",
    a: "They are the same 128-bit format. GUID is the name Microsoft uses; GUIDs are often written in braces, which this tool can add.",
  },
  {
    q: "Is it safe to use these UUIDs as secrets?",
    a: "They come from a cryptographically secure generator, but a UUID is an identifier, not a password. For secrets, use a dedicated token with more entropy.",
  },
];

const appLd = toolApp("uuid-generator", {
  description,
  category: "DeveloperApplication",
  features: ["UUID v4 generation", "Bulk generation up to 1,000", "Uppercase option", "Remove hyphens", "Brace (GUID) format", "Copy all"],
});

export default function UuidGeneratorPage() {
  return (
    <>
      <JsonLd data={graph(appLd, faqPage(`${SITE_URL}/tools/uuid-generator`, faq))} />
      <UuidGeneratorApp />
      <ToolGuide
        tool="uuid-generator"
        intro="A free, in-browser UUID v4 generator from RunExe Technology."
        sections={sections}
        faq={faq}
      />
    </>
  );
}
