import Base64App from "@/components/tools/Base64App";
import JsonLd, { faqPage, graph, toolApp } from "@/components/seo/JsonLd";
import ToolGuide, { type GuideFaq, type GuideSection } from "@/components/seo/ToolGuide";
import { SITE_URL, pageMetadata } from "@/lib/seo/site";

const description =
  "Encode and decode Base64 online with UTF-8 and URL-safe support, or convert a file to Base64. Runs in your browser; nothing is uploaded.";

export const metadata = pageMetadata({
  title: "Base64 Encoder & Decoder (UTF-8, URL-safe, Files) | RunExe",
  description,
  path: "/tools/base64",
});

const sections: GuideSection[] = [
  {
    heading: "What it does",
    body: "Converts text to Base64 and back as you type. Text is encoded as UTF-8 first, so accents, non-Latin scripts and emoji survive the round trip. You can also pick a file and get its Base64, optionally as a data URI.",
  },
  {
    heading: "How to use it",
    ordered: true,
    list: [
      "Choose Encode or Decode.",
      "Type or paste into the left box; the result appears on the right.",
      "Tick URL-safe for tokens and URLs, or choose a file to encode it.",
      "Press Copy output, or Swap to feed the result back in.",
    ],
  },
  {
    heading: "URL-safe Base64",
    body: "URL-safe Base64 (RFC 4648 section 5) replaces + with - and / with _, and drops the = padding. It is used in JWTs and in URLs. When decoding, the tool accepts both forms and adds missing padding for you.",
  },
  {
    heading: "Privacy",
    body: "Encoding and decoding use your browser's built-in functions. Text and files are never sent to a server.",
  },
  {
    heading: "Limitations",
    list: [
      "Decoded output is shown as text, so binary data such as images is reported as non-text instead of displayed.",
      "Very large files are limited by your browser's memory.",
      "Base64 is an encoding, not encryption: anyone can decode it.",
    ],
  },
];

const faq: GuideFaq[] = [
  {
    q: "Is Base64 encryption?",
    a: "No. Base64 only changes how bytes are written so they can travel through text-only systems. Anyone can decode it without a key.",
  },
  {
    q: "Why does my decoded text look broken?",
    a: "The original data may not be UTF-8 text, for example an image or a compressed file. The tool tells you when the decoded bytes are not valid UTF-8.",
  },
  {
    q: "What is the difference between Base64 and Base64URL?",
    a: "Base64URL uses - and _ instead of + and /, and usually drops the = padding, so the result is safe inside URLs and file names.",
  },
  {
    q: "Are my files uploaded?",
    a: "No. Files are read and encoded inside your browser tab.",
  },
];

const appLd = toolApp("base64", {
  description,
  category: "DeveloperApplication",
  features: ["Base64 encode", "Base64 decode", "UTF-8 text support", "URL-safe Base64", "File to Base64", "Data URI output"],
});

export default function Base64Page() {
  return (
    <>
      <JsonLd data={graph(appLd, faqPage(`${SITE_URL}/tools/base64`, faq))} />
      <Base64App />
      <ToolGuide
        tool="base64"
        intro="A free, in-browser Base64 encoder and decoder from RunExe Technology."
        sections={sections}
        faq={faq}
      />
    </>
  );
}
