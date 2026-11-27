import {
  EMAIL,
  LOGO_PATH,
  ORG_ID,
  PHONE_E164_LIST,
  SERVICES,
  SITE_NAME,
  SITE_URL,
  SOCIAL_PROFILES,
  TAGLINE,
  WEBSITE_ID,
  type ToolKey,
  TOOLS,
} from "@/lib/seo/site";

type Json = Record<string, unknown>;

export default function JsonLd({ data }: { data: Json }) {
  // "<" is escaped so content can never close the script element early.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export const organization: Json = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: SITE_NAME,
  alternateName: "RunExe",
  url: SITE_URL,
  logo: { "@type": "ImageObject", url: `${SITE_URL}${LOGO_PATH}` },
  slogan: TAGLINE,
  description:
    "Software engineering studio building custom platforms, AI automation, mobile apps, cloud platforms and digital products.",
  email: EMAIL,
  telephone: PHONE_E164_LIST,
  areaServed: "Worldwide",
  sameAs: SOCIAL_PROFILES,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "sales",
    email: EMAIL,
    telephone: PHONE_E164_LIST,
    availableLanguage: ["English"],
    areaServed: "Worldwide",
  },
  knowsAbout: [
    "Custom software development",
    "AI automation",
    "Mobile app development",
    "Cloud platforms",
    "MVP development",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Software engineering services",
    itemListElement: SERVICES.map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s.name, description: s.description, provider: { "@id": ORG_ID } },
    })),
  },
};

export const website: Json = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: SITE_URL,
  name: SITE_NAME,
  inLanguage: "en",
  publisher: { "@id": ORG_ID },
};

export function faqPage(url: string, items: { q: string; a: string }[]): Json {
  return {
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function toolApp(
  key: ToolKey,
  opts: { description: string; category: string; features: string[] },
): Json {
  const tool = TOOLS[key];
  const url = `${SITE_URL}${tool.path}`;
  return {
    "@type": "WebApplication",
    "@id": `${url}#app`,
    name: tool.name,
    url,
    description: opts.description,
    applicationCategory: opts.category,
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript and a modern web browser",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: opts.features,
    provider: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
  };
}

/** WebApplication JSON-LD pinned to an arbitrary path (SEO landings). */
export function webAppAtPath(opts: {
  name: string;
  path: string;
  description: string;
  category: string;
  features: string[];
}): Json {
  const url = `${SITE_URL}${opts.path}`;
  return {
    "@type": "WebApplication",
    "@id": `${url}#app`,
    name: opts.name,
    url,
    description: opts.description,
    applicationCategory: opts.category,
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript and a modern web browser",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: opts.features,
    provider: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
  };
}

export function breadcrumbList(items: { name: string; path: string }[]): Json {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}

export function howTo(opts: { name: string; description: string; path: string; steps: string[] }): Json {
  const url = `${SITE_URL}${opts.path}`;
  return {
    "@type": "HowTo",
    "@id": `${url}#howto`,
    name: opts.name,
    description: opts.description,
    step: opts.steps.map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: `Step ${i + 1}`,
      text,
    })),
  };
}

export function graph(...nodes: Json[]): Json {
  return { "@context": "https://schema.org", "@graph": nodes };
}
