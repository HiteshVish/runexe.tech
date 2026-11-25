import WordCounterApp from "@/components/tools/WordCounter/WordCounterApp";
import JsonLd, { faqPage, graph, toolApp } from "@/components/seo/JsonLd";
import ToolGuide from "@/components/seo/ToolGuide";
import { wordLandingMeta } from "@/lib/text/landing-meta";
import { wordFaq, wordSections } from "@/lib/text/tool-content";
import { SITE_URL, pageMetadata } from "@/lib/seo/site";

const meta = wordLandingMeta("character-counter");

export const metadata = pageMetadata({
  title: meta.title,
  description: meta.description,
  path: meta.path,
});

const appLd = toolApp("word-counter", {
  description: meta.description,
  category: "UtilitiesApplication",
  features: ["Character and grapheme count", "Browser-only"],
});

export default function CharacterCounterPage() {
  return (
    <>
      <JsonLd data={graph(appLd, faqPage(`${SITE_URL}${meta.path}`, wordFaq))} />
      <WordCounterApp
        headerTitle={meta.h1}
        headerLead={meta.lead}
        highlight="chars"
        landing="character-counter"
      />
      <ToolGuide tool="word-counter" intro={meta.lead} sections={wordSections} faq={wordFaq} />
    </>
  );
}