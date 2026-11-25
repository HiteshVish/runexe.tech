import WordCounterApp from "@/components/tools/WordCounter/WordCounterApp";
import JsonLd, { faqPage, graph, toolApp } from "@/components/seo/JsonLd";
import ToolGuide from "@/components/seo/ToolGuide";
import { WORD_COUNTER_DESCRIPTION, wordFaq, wordSections } from "@/lib/text/tool-content";
import { SITE_URL, pageMetadata } from "@/lib/seo/site";

export const metadata = pageMetadata({
  title: "Free Word & Character Counter | RunExe",
  description: WORD_COUNTER_DESCRIPTION,
  path: "/tools/word-counter",
});

const appLd = toolApp("word-counter", {
  description: WORD_COUNTER_DESCRIPTION,
  category: "UtilitiesApplication",
  features: ["Word count", "Unicode graphemes", "Reading time", "Keyword density"],
});

export default function WordCounterPage() {
  return (
    <>
      <JsonLd data={graph(appLd, faqPage(`${SITE_URL}/tools/word-counter`, wordFaq))} />
      <WordCounterApp />
      <ToolGuide tool="word-counter" intro={WORD_COUNTER_DESCRIPTION} sections={wordSections} faq={wordFaq} />
    </>
  );
}