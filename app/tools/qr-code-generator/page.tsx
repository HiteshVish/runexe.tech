import QrGeneratorApp from "@/components/tools/QrGenerator/QrGeneratorApp";
import JsonLd, { faqPage, graph, toolApp } from "@/components/seo/JsonLd";
import ToolGuide from "@/components/seo/ToolGuide";
import { QR_DESCRIPTION, qrFaq, qrSections } from "@/lib/qr/tool-content";
import { SITE_URL, pageMetadata } from "@/lib/seo/site";

export const metadata = pageMetadata({
  title: "Free QR Code Generator (No Upload) | RunExe",
  description: QR_DESCRIPTION,
  path: "/tools/qr-code-generator",
});

const appLd = toolApp("qr-code-generator", {
  description: QR_DESCRIPTION,
  category: "UtilitiesApplication",
  features: [
    "URL, text, WiFi, WhatsApp, UPI QR codes",
    "PNG and SVG download",
    "Custom colors and optional logo",
    "Runs entirely in the browser",
  ],
});

export default function QrCodeGeneratorPage() {
  return (
    <>
      <JsonLd data={graph(appLd, faqPage(`${SITE_URL}/tools/qr-code-generator`, qrFaq))} />
      <QrGeneratorApp />
      <ToolGuide
        tool="qr-code-generator"
        intro="A free, privacy-first QR code generator from RunExe Technology."
        sections={qrSections}
        faq={qrFaq}
      />
    </>
  );
}