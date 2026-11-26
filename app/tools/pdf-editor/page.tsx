import JsonLd, { breadcrumbList, faqPage, graph, howTo, toolApp } from "@/components/seo/JsonLd";
import ToolGuide from "@/components/seo/ToolGuide";
import PdfStudioClient from "@/components/tools/PdfStudio/PdfStudioClient";
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
  features: ["Merge", "Split", "Sign", "Annotate", "Organize pages", "Compress", "Browser-only"],
});

export default function PdfEditorPage() {
  return (
    <>
      <JsonLd
        data={graph(
          appLd,
          faqPage(`${SITE_URL}/tools/pdf-editor`, pdfFaq),
          howTo({
            name: "How to edit a PDF online with RunExe PDF Studio",
            description: PDF_STUDIO_DESCRIPTION,
            path: "/tools/pdf-editor",
            steps: [
              "Open or drop a PDF — files stay in your browser.",
              "Edit pages: reorder, rotate, add text, images, annotations or an electronic signature.",
              "Download a valid PDF. Nothing is uploaded to RunExe for this tool.",
            ],
          }),
          breadcrumbList([
            { name: "Home", path: "/" },
            { name: "Tools", path: "/tools" },
            { name: "PDF Studio", path: "/tools/pdf-editor" },
          ]),
        )}
      />
      <PdfStudioClient />
      <ToolGuide tool="pdf-editor" intro={PDF_STUDIO_DESCRIPTION} sections={pdfSections} faq={pdfFaq} />
    </>
  );
}