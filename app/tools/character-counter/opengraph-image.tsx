import { ogContentType, ogSize, renderOgImage } from "@/lib/seo/og-image";

export const alt = "Character counter by RunExe";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    kicker: "Free tool",
    title: "Character Counter",
    subtitle: "Count characters and graphemes in your browser.",
  });
}