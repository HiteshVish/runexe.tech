import type { GuideFaq, GuideSection } from "@/components/seo/ToolGuide";

export const WORD_COUNTER_DESCRIPTION =
  "Count words, characters, sentences and reading time. Unicode-aware, with keyword density and character limits — runs in your browser.";

export const wordSections: GuideSection[] = [
  {
    heading: "What it does",
    body: "Live word and character counts, reading and speaking time estimates, keyword density, platform character limits, and quick text transforms.",
  },
  {
    heading: "Privacy",
    body: "Your text stays in the tab. We do not save it or send it to a server.",
  },
  {
    heading: "How to use it",
    ordered: true,
    list: ["Paste or type your text.", "Check stats and limits.", "Copy or transform text as needed."],
  },
];

export const wordFaq: GuideFaq[] = [
  {
    q: "How are words counted?",
    a: "In modern browsers we use Intl.Segmenter for word boundaries, which handles English and many other scripts. Older browsers use a Unicode letter/number fallback.",
  },
  {
    q: "Does the counter include spaces?",
    a: "We show both: characters with spaces and characters without spaces. Limits use the metric shown on each preset.",
  },
  {
    q: "How many words is a 1-page essay?",
    a: "A typed page is often about 250–300 words (single-spaced). Use the word count here to check your draft.",
  },
  {
    q: "Is my text saved?",
    a: "No. Nothing is stored in localStorage and nothing is uploaded.",
  },
  {
    q: "Does it support Hindi?",
    a: "Yes. Grapheme and word segmentation handle Devanagari and mixed-language text.",
  },
];