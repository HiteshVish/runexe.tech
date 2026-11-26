import PdfLandingShell from "@/components/tools/PdfStudio/PdfLandingShell";
import { pdfLandingMeta } from "@/lib/pdf-studio/landing-meta";
import { pageMetadata } from "@/lib/seo/site";

const meta = pdfLandingMeta("merge-pdf");

export const metadata = pageMetadata({
  title: meta.title,
  description: meta.description,
  path: meta.path,
});

export default function Page() {
  return <PdfLandingShell slug="merge-pdf" />;
}
