import { ogContentType, ogSize, renderOgImage } from "@/lib/seo/og-image";

export const alt = "RunExe PDF Studio";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    kicker: "Free tool",
    title: "PDF Studio",
    subtitle: "Edit, merge, split and sign PDFs in your browser.",
  });
}