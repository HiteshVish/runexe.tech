import HashGeneratorApp from "@/components/tools/HashGeneratorApp";
import JsonLd, { faqPage, graph, toolApp } from "@/components/seo/JsonLd";
import ToolGuide, { type GuideFaq, type GuideSection } from "@/components/seo/ToolGuide";
import { SITE_URL, pageMetadata } from "@/lib/seo/site";

const description =
  "Generate SHA-1, SHA-256, SHA-384 and SHA-512 hashes of text or files online. Uses the browser's Web Crypto API; nothing is uploaded.";

export const metadata = pageMetadata({
  title: "Hash Generator — SHA-256, SHA-512 & SHA-1 | RunExe",
  description,
  path: "/tools/hash-generator",
});

const sections: GuideSection[] = [
  {
    heading: "What it does",
    body: "Calculates four SHA hashes at once for the text you type or a file you choose, and updates them as the input changes. Hashes are shown in hexadecimal, in lower or upper case.",
  },
  {
    heading: "How to use it",
    ordered: true,
    list: [
      "Type or paste text, or choose a file.",
      "Read the SHA-1, SHA-256, SHA-384 and SHA-512 results.",
      "Press Copy next to the hash you need.",
    ],
  },
  {
    heading: "Common uses",
    list: [
      "Checking that a downloaded file matches its published checksum",
      "Comparing two files or strings without reading them",
      "Producing test vectors for code that hashes data",
    ],
  },
  {
    heading: "Privacy",
    body: "Hashing runs in your browser through the Web Crypto API. Text and files stay in your tab.",
  },
  {
    heading: "Limitations",
    list: [
      "MD5 is not available, because browsers do not include it in Web Crypto.",
      "SHA-1 is broken for security uses; use it only for compatibility checks.",
      "Hashes are not suitable for storing passwords. Use a password hashing function such as Argon2 or bcrypt.",
      "Very large files are limited by your browser's memory.",
    ],
  },
];

const faq: GuideFaq[] = [
  {
    q: "Which hash should I use?",
    a: "SHA-256 is the usual choice for checksums and signatures. SHA-512 gives a longer output. Avoid SHA-1 for anything security-related.",
  },
  {
    q: "Can a hash be reversed?",
    a: "No. A cryptographic hash is one-way, although short or common inputs can be guessed by trying many candidates.",
  },
  {
    q: "Is my file uploaded?",
    a: "No. The file is read and hashed inside your browser tab.",
  },
  {
    q: "Why is there no MD5 option?",
    a: "The browser's Web Crypto API does not provide MD5, and MD5 is no longer considered secure.",
  },
];

const appLd = toolApp("hash-generator", {
  description,
  category: "DeveloperApplication",
  features: ["SHA-1", "SHA-256", "SHA-384", "SHA-512", "Text and file hashing", "Hex output, lower or upper case"],
});

export default function HashGeneratorPage() {
  return (
    <>
      <JsonLd data={graph(appLd, faqPage(`${SITE_URL}/tools/hash-generator`, faq))} />
      <HashGeneratorApp />
      <ToolGuide
        tool="hash-generator"
        intro="A free, in-browser SHA hash generator from RunExe Technology."
        sections={sections}
        faq={faq}
      />
    </>
  );
}
