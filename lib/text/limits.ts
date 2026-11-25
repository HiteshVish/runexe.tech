export type LimitPreset = {
  id: string;
  label: string;
  max: number;
  /** count graphemes vs chars */
  mode: "chars" | "graphemes";
};

export const LIMIT_PRESETS: LimitPreset[] = [
  { id: "twitter", label: "X / Twitter post", max: 280, mode: "chars" },
  { id: "sms", label: "SMS", max: 160, mode: "chars" },
  { id: "seo-title", label: "SEO title", max: 60, mode: "chars" },
  { id: "meta-desc", label: "Meta description", max: 160, mode: "chars" },
  { id: "instagram", label: "Instagram bio", max: 150, mode: "chars" },
  { id: "linkedin", label: "LinkedIn headline", max: 220, mode: "chars" },
  { id: "youtube", label: "YouTube title", max: 100, mode: "chars" },
  { id: "gads", label: "Google Ads headline", max: 30, mode: "chars" },
];