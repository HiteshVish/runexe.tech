import PdfStudioClient from "@/components/tools/PdfStudio/PdfStudioClient";
import JsonLd, { faqPage, graph, toolApp } from "@/components/seo/JsonLd";
import ToolGuide from "@/components/seo/ToolGuide";
import { PDF_STUDIO_DESCRIPTION, pdfFaq, pdfSections } from "@/lib/pdf-studio/tool-content";
import { SITE_URL, pageMetadata } from "@/lib/seo/site";

export const metadata = pageMetadata({
  title: "Free Online PDF Editor | RunExe PDF Studio",
  description: PDF_STUDIO_DESCRIPTION,
  path: "/tools/pdf-editor",
});

const appLd = toolApp("pdf-editor", {
  description: PDF_STUDIO_DESCRIPTION,
  category: "BusinessApplication",
  features: ["Merge", "Split", "Sign", "Annotate", "Organize pages"],
});

export default function PdfEditorPage() {
  return (
    <>
      <JsonLd data={graph(appLd, faqPage(`${SITE_URL}/tools/pdf-editor`, pdfFaq))} />
      <PdfStudioClient />
      <ToolGuide tool="pdf-editor" intro={PDF_STUDIO_DESCRIPTION} sections={pdfSections} faq={pdfFaq} />
    </>
  );
}