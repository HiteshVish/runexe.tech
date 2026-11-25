import { ogContentType, ogSize, renderOgImage } from "@/lib/seo/og-image";

export const alt = "Reading time calculator by RunExe";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    kicker: "Free tool",
    title: "Reading Time Calculator",
    subtitle: "Estimate read and speak time from word count.",
  });
}