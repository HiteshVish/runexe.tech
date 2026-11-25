import WordCounterApp from "@/components/tools/WordCounter/WordCounterApp";
import JsonLd, { faqPage, graph, toolApp } from "@/components/seo/JsonLd";
import ToolGuide from "@/components/seo/ToolGuide";
import { wordLandingMeta } from "@/lib/text/landing-meta";
import { wordFaq, wordSections } from "@/lib/text/tool-content";
import { SITE_URL, pageMetadata } from "@/lib/seo/site";

const meta = wordLandingMeta("reading-time-calculator");

export const metadata = pageMetadata({
  title: meta.title,
  description: meta.description,
  path: meta.path,
});

const appLd = toolApp("word-counter", {
  description: meta.description,
  category: "UtilitiesApplication",
  features: ["Reading and speaking time", "Browser-only"],
});

export default function ReadingTimePage() {
  return (
    <>
      <JsonLd data={graph(appLd, faqPage(`${SITE_URL}${meta.path}`, wordFaq))} />
      <WordCounterApp
        headerTitle={meta.h1}
        headerLead={meta.lead}
        highlight="time"
        landing="reading-time-calculator"
      />
      <ToolGuide tool="word-counter" intro={meta.lead} sections={wordSections} faq={wordFaq} />
    </>
  );
}