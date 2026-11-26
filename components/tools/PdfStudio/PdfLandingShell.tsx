import JsonLd, { breadcrumbList, faqPage, graph, howTo, webAppAtPath } from "@/components/seo/JsonLd";
import ToolGuide from "@/components/seo/ToolGuide";
import PdfStudioClient from "@/components/tools/PdfStudio/PdfStudioClient";
import { type PdfLandingSlug, pdfLandingMeta } from "@/lib/pdf-studio/landing-meta";
import { landingContent } from "@/lib/pdf-studio/tool-content";
import { SITE_URL } from "@/lib/seo/site";

export default function PdfLandingShell({ slug }: { slug: PdfLandingSlug }) {
  const meta = pdfLandingMeta(slug);
  const content = landingContent(slug);
  const url = `${SITE_URL}${meta.path}`;

  const appLd = webAppAtPath({
    name: `${meta.h1} | RunExe PDF Studio`,
    path: meta.path,
    description: meta.description,
    category: "BusinessApplication",
    features: content.features,
  });

  return (
    <>
      <JsonLd
        data={graph(
          appLd,
          faqPage(url, content.faq),
          howTo({
            name: content.howTo.name,
            description: meta.description,
            path: meta.path,
            steps: content.howTo.steps,
          }),
          breadcrumbList([
            { name: "Home", path: "/" },
            { name: "Tools", path: "/tools" },
            { name: "PDF Studio", path: "/tools/pdf-editor" },
            { name: meta.h1, path: meta.path },
          ]),
        )}
      />
      <PdfStudioClient headerTitle={meta.h1} headerLead={meta.lead} initialMode={meta.mode} />
      <ToolGuide tool="pdf-editor" intro={meta.lead} sections={content.sections} faq={content.faq} />
    </>
  );
}