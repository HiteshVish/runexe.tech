import QrGeneratorApp from "@/components/tools/QrGenerator/QrGeneratorApp";
import JsonLd, { faqPage, graph, toolApp } from "@/components/seo/JsonLd";
import ToolGuide from "@/components/seo/ToolGuide";
import { qrLandingMeta } from "@/lib/qr/landing-meta";
import { qrFaq, qrSections } from "@/lib/qr/tool-content";
import { SITE_URL, pageMetadata } from "@/lib/seo/site";

const meta = qrLandingMeta("upi-qr-code-generator");

export const metadata = pageMetadata({
  title: meta.title,
  description: meta.description,
  path: meta.path,
});

const appLd = toolApp("qr-code-generator", {
  description: meta.description,
  category: "UtilitiesApplication",
  features: ["UPI payment QR for shops", "Browser-only", "PNG and printable sign"],
});

export default function UpiQrPage() {
  return (
    <>
      <JsonLd data={graph(appLd, faqPage(`${SITE_URL}${meta.path}`, qrFaq))} />
      <QrGeneratorApp
        headerTitle={meta.h1}
        headerLead={meta.lead}
        initialType="upi"
        currentLanding="upi-qr-code-generator"
      />
      <ToolGuide tool="qr-code-generator" intro={meta.lead} sections={qrSections} faq={qrFaq} />
    </>
  );
}