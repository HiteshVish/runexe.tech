import JsonFormatterApp from "@/components/tools/JsonFormatterApp";
import JsonLd, { faqPage, graph, toolApp } from "@/components/seo/JsonLd";
import ToolGuide, { type GuideFaq, type GuideSection } from "@/components/seo/ToolGuide";
import { SITE_URL, pageMetadata } from "@/lib/seo/site";

const description =
  "Format, validate and minify JSON directly in your browser. Nothing is uploaded. Free developer tool by RunExe Technology.";

export const metadata = pageMetadata({
  title: "JSON Formatter & Validator (Free, In-Browser) | RunExe",
  description,
  path: "/tools/json-formatter",
});

const sections: GuideSection[] = [
  {
    heading: "What it does",
    body: "Paste JSON to pretty-print it with two-space indentation, compress it to a single line, or check that it is valid. Invalid input shows the parser's error message so you can find the problem.",
  },
  {
    heading: "Who it is for",
    list: [
      "Developers reading API responses and webhook payloads",
      "QA engineers checking request bodies and fixtures",
      "Anyone who needs to tidy or validate a config file",
    ],
  },
  {
    heading: "How to use it",
    ordered: true,
    list: [
      "Paste your JSON into the editor.",
      "Press Format to indent it, Minify to remove whitespace, or Validate to check it.",
      "Press Copy to put the result on your clipboard, or Clear to start again.",
    ],
  },
  {
    heading: "Example",
    body: 'Input {"name":"RunExe","tools":["tempmail","invoice"]} becomes an indented object with each key on its own line after Format, and returns to one line after Minify.',
  },
  {
    heading: "Privacy",
    body: "Formatting, minifying and validating run in your browser tab with the built-in JSON parser. The tool does not send your JSON to a server.",
  },
  {
    heading: "Limitations",
    list: [
      "Input must be strict JSON: no comments, trailing commas or single-quoted strings.",
      "Numbers larger than JavaScript can represent exactly (beyond 2^53) may lose precision when reformatted.",
      "If a key appears twice in an object, only the last value is kept after formatting.",
      "Very large documents are limited by your browser's memory.",
    ],
  },
];

const faq: GuideFaq[] = [
  {
    q: "Is my JSON uploaded anywhere?",
    a: "No. Parsing and formatting happen in your browser tab; the tool does not send your input to a server.",
  },
  {
    q: "Why does my JSON fail validation?",
    a: "Common causes are trailing commas, comments, single quotes around strings or keys, and unquoted keys. The error message shows what the parser found.",
  },
  {
    q: "What is the difference between Format and Minify?",
    a: "Format adds line breaks and two-space indentation for reading. Minify removes all optional whitespace to make the JSON as small as possible.",
  },
  {
    q: "Is the JSON formatter free?",
    a: "Yes. It is free to use with no signup.",
  },
];

const appLd = toolApp("json-formatter", {
  description,
  category: "DeveloperApplication",
  features: ["Format (pretty-print) JSON", "Minify JSON", "Validate JSON with error messages", "Copy to clipboard"],
});

export default function JsonFormatterPage() {
  return (
    <>
      <JsonLd data={graph(appLd, faqPage(`${SITE_URL}/tools/json-formatter`, faq))} />
      <JsonFormatterApp />
      <ToolGuide
        tool="json-formatter"
        intro="A free, in-browser JSON beautifier, minifier and validator from RunExe Technology."
        sections={sections}
        faq={faq}
      />
    </>
  );
}
