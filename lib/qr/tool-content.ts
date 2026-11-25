import type { GuideFaq, GuideSection } from "@/components/seo/ToolGuide";

export const QR_DESCRIPTION =
  "Create URL, text, WiFi, WhatsApp, and UPI payment QR codes in your browser. Customize colors and size, download PNG or SVG — nothing is uploaded or stored.";

export const qrSections: GuideSection[] = [
  {
    heading: "What it does",
    body: "Build scannable QR codes for links, plain text, WiFi networks, WhatsApp chat links, and Indian UPI payments. Adjust colors, quiet zone, size, and error correction. Add an optional center logo or export a printable UPI shop sign.",
  },
  {
    heading: "Privacy",
    body: "Everything runs in your tab with the qrcode library and canvas. No server, no account, and no localStorage — WiFi passwords and UPI IDs are not saved.",
  },
  {
    heading: "How to use it",
    ordered: true,
    list: [
      "Choose a QR type (URL, WiFi, UPI, and more).",
      "Fill in the details and tweak colors or size.",
      "Download PNG or SVG, or copy the image to the clipboard.",
    ],
  },
  {
    heading: "How to create a UPI QR for your shop",
    body: "Enter your shop’s UPI ID (VPA) and the name that should appear in payment apps. Leave amount blank for a reusable counter QR so customers type the amount when they pay. Always scan-test with your own UPI app before printing.",
    list: [
      "Use a dark QR on a white or light background for reliable scanning.",
      "Print at least 2–3 cm square for posters.",
      "Keep the payee name short and recognizable.",
    ],
  },
];

export const qrFaq: GuideFaq[] = [
  {
    q: "Is this UPI QR code safe?",
    a: "The QR only encodes what you type (VPA, name, optional amount). It is not linked to RunExe servers. Scan it yourself in PhonePe, Google Pay, or Paytm before you display it publicly.",
  },
  {
    q: "Does the QR expire?",
    a: "No. A static QR does not expire. If your UPI ID or WiFi password changes, generate a new code.",
  },
  {
    q: "Can I add a fixed amount?",
    a: "Yes for UPI — enter an amount in the form and it is included in the payment link. Leave amount empty for customers to enter the value at scan time.",
  },
  {
    q: "How do I make a WiFi QR code?",
    a: "Choose WiFi, enter SSID and password, pick WPA/WEP or None, and download. Special characters in the password are escaped automatically.",
  },
  {
    q: "Is my data stored?",
    a: "No. Nothing is sent to our servers and nothing is saved in your browser.",
  },
];