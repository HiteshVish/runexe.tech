/**
 * Shipped client work. Highlights describe only what each live site shows;
 * do not add metrics, stacks or results that the client has not confirmed.
 */
export type Project = {
  slug: string;
  name: string;
  client?: string;
  industry: "Healthcare" | "Fintech" | "Hospitality";
  category: string;
  country?: string;
  /** Omitted when the public URL does not currently show this project. */
  url?: string;
  image: string;
  imageAlt: string;
  summary: string;
  highlights: string[];
};

export const PROJECTS: Project[] = [
  {
    slug: "lifecare-diagnostics",
    name: "LifeCare Diagnostics",
    client: "Gulab Pal",
    industry: "Healthcare",
    category: "HealthTech · Diagnostics",
    country: "India",
    url: "https://lifecarediagnostics.com/",
    image: "/assets/work/lifecare.webp",
    imageAlt: "Lifecare Diagnostics website home page",
    summary:
      "Website for an NABL-accredited diagnostics lab in Mumbai, where patients can browse tests and health packages and book an appointment online.",
    highlights: [
      "Health packages, including genomics and allergy panels",
      "Tests organised by organ and by lifestyle risk",
      "Home care and corporate care services",
      "Online appointment booking and prescription upload",
      "Centre listings and a full test list",
    ],
  },
  {
    slug: "vrc-club",
    name: "VRC Club",
    industry: "Hospitality",
    category: "Membership · Platform",
    country: "Hong Kong",
    url: "https://vrchk.vkinternationallimited.com/",
    image: "/assets/work/vrc-club.webp",
    imageAlt: "Victoria Recreation Club website home page",
    summary:
      "Membership website for Victoria Recreation Club, the oldest private club in Hong Kong, covering one membership across two waterfront clubhouses.",
    highlights: [
      "Clubhouse pages for Deep Water Bay and Emerald Bay",
      "Membership information",
      "Events, courses, youth and sport sections",
      "Club shop and heritage history",
      "Weather forecast panel",
    ],
  },
  {
    slug: "vk-smarttech",
    name: "VK SmartTech",
    client: "Jeet Raj",
    industry: "Fintech",
    category: "Fintech · Business Setup",
    country: "Hong Kong",
    url: "https://vk.runexe.tech/",
    image: "/assets/work/vk-smarttech.webp",
    imageAlt: "VK SmartTech Hong Kong company and business account services website",
    summary:
      "Onboarding platform for VK SmartTech in Hong Kong that guides clients through company registration and opening business and personal accounts online.",
    highlights: [
      "Register a Hong Kong company and open a business account",
      "Business account opening for existing companies",
      "Personal digital wallet sign-up",
      "Fully online process with a dedicated advisor",
      "Live FX rate display",
    ],
  },
  {
    slug: "ddfc-loan-app",
    name: "DDFC Loan App",
    client: "Abhishek Dubey",
    industry: "Fintech",
    category: "Fintech · Lending",
    image: "/assets/work/ddfc.webp",
    imageAlt: "Illustration of a loan app landing page and mobile dashboard",
    summary: "Lending app for DDFC.",
    highlights: [],
  },
];

export const PROJECT_INDUSTRIES = [...new Set(PROJECTS.map((p) => p.industry))];
export const PROJECT_COUNTRIES = [...new Set(PROJECTS.flatMap((p) => (p.country ? [p.country] : [])))];
