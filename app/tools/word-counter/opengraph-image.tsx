import { ogContentType, ogSize, renderOgImage } from "@/lib/seo/og-image";

export const alt = "Word counter by RunExe";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    kicker: "Free tool",
    title: "Word & Character Counter",
    subtitle: "Unicode-aware counts. Private browser tool.",
  });
}