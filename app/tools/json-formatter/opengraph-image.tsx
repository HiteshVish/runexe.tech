import { ogContentType, ogSize, renderOgImage } from "@/lib/seo/og-image";

export const alt = "Free JSON formatter and validator by RunExe";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    kicker: "Free tool",
    title: "JSON Formatter & Validator",
    subtitle: "Format, minify and validate JSON in your browser. Nothing is uploaded.",
  });
}
