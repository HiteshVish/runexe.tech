export type WordLandingSlug = "word-counter" | "character-counter" | "reading-time-calculator";

export const WORD_LANDING_PATHS = {
  "word-counter": "/tools/word-counter",
  "character-counter": "/tools/character-counter",
  "reading-time-calculator": "/tools/reading-time-calculator",
} as const;

export function wordLandingMeta(slug: Exclude<WordLandingSlug, "word-counter">) {
  if (slug === "character-counter") {
    return {
      title: "Character Counter – Free Online | RunExe",
      description: "Count characters with or without spaces, graphemes and Unicode text. Runs in your browser.",
      h1: "Character counter",
      lead: "Count characters, graphemes, and bytes in real time. Nothing is uploaded or stored.",
      focus: "chars" as const,
      path: WORD_LANDING_PATHS[slug],
    };
  }
  return {
    title: "Reading Time Calculator – Free | RunExe",
    description: "Estimate reading and speaking time from word count. Browser-only, private.",
    h1: "Reading time calculator",
    lead: "See how long your text takes to read aloud or silently — live as you type.",
    focus: "time" as const,
    path: WORD_LANDING_PATHS[slug],
  };
}