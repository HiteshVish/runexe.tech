import type { GuideFaq, GuideSection } from "@/components/seo/ToolGuide";

export const PASSWORD_DESCRIPTION =
  "Free secure password and passphrase generator. Uses your browser's crypto.getRandomValues — nothing is uploaded or stored.";

export const passwordSections: GuideSection[] = [
  {
    heading: "What it does",
    body: "Create random passwords with chosen length and character sets, or diceware-style passphrases from a large word list. See estimated strength in bits and copy or bulk-generate results.",
  },
  {
    heading: "Privacy",
    body: "Passwords are generated locally in your tab. They are not sent to RunExe servers and are not saved in localStorage or the URL.",
  },
  {
    heading: "How to use it",
    ordered: true,
    list: [
      "Choose random password or passphrase mode.",
      "Set length and character options (or word count).",
      "Copy or regenerate — bulk-generate if you need several at once.",
    ],
  },
];

export const passwordFaq: GuideFaq[] = [
  {
    q: "Is this password generator safe?",
    a: "Yes for typical use: it uses the browser's cryptographically secure random number generator (crypto.getRandomValues) with unbiased character selection. No password leaves your device.",
  },
  {
    q: "Are my passwords stored or sent anywhere?",
    a: "No. Generation happens entirely in your browser. We do not log, store, or transmit your passwords.",
  },
  {
    q: "How long should a password be?",
    a: "For most accounts, 16+ random characters with mixed types is a solid default. Passphrases of 5–6 unrelated words can be equally strong and easier to type.",
  },
  {
    q: "What is a passphrase?",
    a: "A passphrase joins several random dictionary words (for example with hyphens). With enough words it has high entropy and can be memorable.",
  },
  {
    q: "How are the passwords generated?",
    a: "Random passwords pick characters using rejection sampling to avoid modulo bias, guarantee at least one character from each enabled type, then shuffle with Fisher–Yates. Passphrases pick words from a static in-page word list.",
  },
];