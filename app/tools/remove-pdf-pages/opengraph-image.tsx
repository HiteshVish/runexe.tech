import { ogContentType, ogSize, renderOgImage } from "@/lib/seo/og-image";
import { pdfLandingMeta } from "@/lib/pdf-studio/landing-meta";

const meta = pdfLandingMeta("remove-pdf-pages");

export const alt = meta.h1 + " by RunExe";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    kicker: "Free tool",
    title: meta.h1,
    subtitle: meta.description.slice(0, 90),
  });
}
