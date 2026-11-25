import PdfStudioClient from "@/components/tools/PdfStudio/PdfStudioClient";
import JsonLd, { faqPage, graph, toolApp } from "@/components/seo/JsonLd";
import ToolGuide from "@/components/seo/ToolGuide";
import { pdfLandingMeta } from "@/lib/pdf-studio/landing-meta";
import { pdfFaq, pdfSections } from "@/lib/pdf-studio/tool-content";
import { SITE_URL, pageMetadata } from "@/lib/seo/site";

const meta = pdfLandingMeta("remove-pdf-pages");

export const metadata = pageMetadata({
  title: meta.title,
  description: meta.description,
  path: meta.path,
});

const appLd = toolApp("pdf-editor", {
  description: meta.description,
  category: "BusinessApplication",
  features: [meta.h1],
});

export default function Page() {
  return (
    <>
      <JsonLd data={graph(appLd, faqPage(`${SITE_URL}${meta.path}`, pdfFaq))} />
      <PdfStudioClient headerTitle={meta.h1} headerLead={meta.lead} initialMode={meta.mode} />
      <ToolGuide tool="pdf-editor" intro={meta.lead} sections={pdfSections} faq={pdfFaq} />
    </>
  );
}
