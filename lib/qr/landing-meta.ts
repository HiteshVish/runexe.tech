import type { QrType } from "./types";

export const QR_LANDING_SLUGS = ["upi-qr-code-generator", "wifi-qr-code-generator", "whatsapp-qr-code-generator"] as const;

export type QrLandingSlug = (typeof QR_LANDING_SLUGS)[number];

const LANDING: Record<
  QrLandingSlug,
  {
    title: string;
    description: string;
    h1: string;
    lead: string;
    path: string;
    initialType: QrType;
  }
> = {
  "upi-qr-code-generator": {
    title: "UPI QR Code Generator – Free, No Signup | RunExe",
    description:
      "Create a free UPI payment QR code for your shop. Enter VPA and payee name — runs in your browser, nothing is stored.",
    h1: "UPI QR Code Generator",
    lead: "Make a scannable UPI QR for your shop or business. Runs in your browser. Nothing is uploaded or stored.",
    path: "/tools/upi-qr-code-generator",
    initialType: "upi",
  },
  "wifi-qr-code-generator": {
    title: "WiFi QR Code Generator – Free | RunExe",
    description:
      "Generate a WiFi QR code guests can scan to join your network. WPA, WEP or open — 100% in your browser.",
    h1: "WiFi QR Code Generator",
    lead: "Share your WiFi network with a printable QR code. Runs in your browser — passwords never leave your device.",
    path: "/tools/wifi-qr-code-generator",
    initialType: "wifi",
  },
  "whatsapp-qr-code-generator": {
    title: "WhatsApp Link QR Code Generator – Free | RunExe",
    description:
      "Create a WhatsApp chat QR with country code and optional pre-filled message. Free, browser-only, no signup.",
    h1: "WhatsApp Link QR Code Generator",
    lead: "Link a QR code to your WhatsApp number with an optional message. Runs in your browser. Nothing is uploaded.",
    path: "/tools/whatsapp-qr-code-generator",
    initialType: "whatsapp",
  },
};

export function isQrLandingSlug(s: string): s is QrLandingSlug {
  return (QR_LANDING_SLUGS as readonly string[]).includes(s);
}

export function qrLandingMeta(slug: QrLandingSlug) {
  return LANDING[slug];
}

/** Landing routes are flat paths under /tools/ */
export function qrLandingPath(slug: QrLandingSlug) {
  return LANDING[slug].path;
}