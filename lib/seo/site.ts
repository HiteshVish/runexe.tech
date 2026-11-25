import type { Metadata } from "next";

export const SITE_URL = "https://runexe.tech";
export const SITE_NAME = "RunExe Technology";
export const SHORT_NAME = "RunExe";
export const TAGLINE = "Engineering that executes.";
export const EMAIL = "info@runexe.tech";
export const PHONE = "+91 93268 09409";
export const PHONE_E164 = "+919326809409";
export const LOGO_PATH = "/assets/logo-full.png";
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const SOCIAL_PROFILES = [
  "https://www.instagram.com/runexe.tech/",
  "https://www.facebook.com/profile.php?id=61576570486275",
];

export const SERVICES = [
  {
    name: "Custom Software",
    description:
      "Bespoke platforms and internal tools engineered around your exact workflows — from ERP layers to data-heavy dashboards.",
  },
  {
    name: "AI Automation",
    description:
      "LLM agents, intelligent pipelines and decision automation that remove manual work and compound over time.",
  },
  {
    name: "Mobile Apps",
    description:
      "Native-quality iOS and Android products — fast, offline-tolerant and polished to the last micro-interaction.",
  },
  {
    name: "Cloud Platforms",
    description:
      "Resilient, autoscaling infrastructure on AWS, GCP and Azure — CI/CD, observability and cost discipline built in.",
  },
  {
    name: "Digital Products",
    description:
      "End-to-end product design and build — strategy, UX, brand-grade interfaces and the engine room behind them.",
  },
];

/** Mirrors the visible FAQ on the home page; keep both in sync. */
export const HOME_FAQ = [
  {
    q: "How much does a typical project cost?",
    a: "Most engagements land between $25k and $150k depending on scope. After a free discovery call, you get a fixed-scope blueprint with a firm number — no hourly meters running in the background.",
  },
  {
    q: "How long does an MVP take?",
    a: "A production-ready MVP typically ships in 8–14 weeks. You'll see a working staging build from week two and shippable increments every week after that.",
  },
  {
    q: "Who owns the code and IP?",
    a: "You do — fully and from day one. Everything lives in repositories you control, with documentation and handover baked into the process, not sold as an add-on.",
  },
  {
    q: "Do you work with existing in-house teams?",
    a: "Constantly. We can lead delivery end-to-end or embed alongside your engineers — shared standups, shared code review, shared standards. We adapt to your workflow, not the other way around.",
  },
  {
    q: "What happens after launch?",
    a: "Every launch includes a stabilization window, monitoring and a handover plan. Most clients continue with a monthly Run & Evolve retainer — performance budgets, feature velocity and a quarterly technical roadmap.",
  },
];

export type ToolKey =
  | "invoice"
  | "tempmail"
  | "json-formatter"
  | "base64"
  | "jwt-decoder"
  | "uuid-generator"
  | "hash-generator"
  | "image-compressor"
  | "qr-code-generator"
  | "password-generator"
  | "word-counter"
  | "pdf-editor";

export type ToolCategory = "Business" | "Privacy" | "Developer";
export type ToolIconName =
  | "invoice"
  | "mail"
  | "braces"
  | "base64"
  | "key"
  | "fingerprint"
  | "hash"
  | "image"
  | "qr"
  | "lock"
  | "text"
  | "pdf";

export type Tool = {
  name: string;
  path: string;
  summary: string;
  category: ToolCategory;
  /** "browser": input never leaves the tab. "server": the runexe.tech API does part of the work. */
  runsIn: "browser" | "server";
  icon: ToolIconName;
  tags: string[];
};

/** Order here is the display order on /tools and the home page. */
export const TOOLS: Record<ToolKey, Tool> = {
  invoice: {
    name: "Invoice Generator",
    path: "/tools/invoice",
    summary: "Build invoices with no tax, VAT or India GST, preview them live and download a PDF.",
    category: "Business",
    runsIn: "server",
    icon: "invoice",
    tags: ["GST", "VAT", "PDF", "10 currencies"],
  },
  tempmail: {
    name: "Temporary Email Generator",
    path: "/tools/tempmail",
    summary: "Create a disposable inbox for testing sign-ups and email flows. No signup.",
    category: "Privacy",
    runsIn: "server",
    icon: "mail",
    tags: ["Disposable inbox", "Attachments", "SPF/DKIM"],
  },
  "json-formatter": {
    name: "JSON Formatter & Validator",
    path: "/tools/json-formatter",
    summary: "Format, minify and validate JSON in your browser. Nothing is uploaded.",
    category: "Developer",
    runsIn: "browser",
    icon: "braces",
    tags: ["Format", "Minify", "Validate"],
  },
  base64: {
    name: "Base64 Encoder & Decoder",
    path: "/tools/base64",
    summary: "Encode or decode Base64 text with UTF-8 and URL-safe support, or turn a file into Base64.",
    category: "Developer",
    runsIn: "browser",
    icon: "base64",
    tags: ["UTF-8", "URL-safe", "Files"],
  },
  "jwt-decoder": {
    name: "JWT Decoder",
    path: "/tools/jwt-decoder",
    summary: "Read a JSON Web Token's header and payload, with expiry and issued-at times as dates.",
    category: "Developer",
    runsIn: "browser",
    icon: "key",
    tags: ["Header", "Claims", "Expiry"],
  },
  "uuid-generator": {
    name: "UUID Generator",
    path: "/tools/uuid-generator",
    summary: "Generate random version 4 UUIDs, one or hundreds at a time, and copy them in one click.",
    category: "Developer",
    runsIn: "browser",
    icon: "fingerprint",
    tags: ["UUID v4", "Bulk", "Copy all"],
  },
  "hash-generator": {
    name: "Hash Generator",
    path: "/tools/hash-generator",
    summary: "Create SHA-1, SHA-256, SHA-384 and SHA-512 hashes of text or a file in your browser.",
    category: "Developer",
    runsIn: "browser",
    icon: "hash",
    tags: ["SHA-256", "SHA-512", "Files"],
  },
  "image-compressor": {
    name: "Image Compressor & Resizer",
    path: "/tools/image-compressor",
    summary: "Compress and resize JPG, PNG and WebP to a target size. Runs in your browser — nothing is uploaded.",
    category: "Developer",
    runsIn: "browser",
    icon: "image",
    tags: ["Compress", "Resize", "WebP", "Target KB"],
  },
  "qr-code-generator": {
    name: "QR Code Generator",
    path: "/tools/qr-code-generator",
    summary: "Create URL, WiFi, WhatsApp and UPI QR codes. Customize and download PNG or SVG — runs in your browser.",
    category: "Developer",
    runsIn: "browser",
    icon: "qr",
    tags: ["UPI", "WiFi", "WhatsApp", "PNG"],
  },
  "password-generator": {
    name: "Password Generator",
    path: "/tools/password-generator",
    summary: "Strong random passwords and passphrases with crypto.getRandomValues. Nothing is stored or sent.",
    category: "Privacy",
    runsIn: "browser",
    icon: "lock",
    tags: ["Secure", "Passphrase", "Copy"],
  },
  "word-counter": {
    name: "Word & Character Counter",
    path: "/tools/word-counter",
    summary: "Count words, characters and reading time with Unicode support. Keyword density and limits — private.",
    category: "Developer",
    runsIn: "browser",
    icon: "text",
    tags: ["Words", "Unicode", "SEO limits"],
  },
  "pdf-editor": {
    name: "PDF Studio",
    path: "/tools/pdf-editor",
    summary: "Edit, merge, split, sign and organize PDFs in your browser. Free — no signup, no upload, no watermarks.",
    category: "Business",
    runsIn: "browser",
    icon: "pdf",
    tags: ["Merge", "Split", "Sign", "Edit"],
  },
};

export const TOOL_KEYS = Object.keys(TOOLS) as ToolKey[];

/** Stable count for nav copy — keep in sync with TOOLS.runsIn === "browser". */
export const BROWSER_TOOL_COUNT = TOOL_KEYS.filter((k) => TOOLS[k].runsIn === "browser").length;

type PageSeo = {
  title: string;
  description: string;
  path: string;
};

/** Per-page metadata: absolute title, canonical, Open Graph and Twitter. */
export function pageMetadata({ title, description, path }: PageSeo): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url: path,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
