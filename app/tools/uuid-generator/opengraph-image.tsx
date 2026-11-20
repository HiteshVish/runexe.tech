import { ogContentType, ogSize, renderOgImage } from "@/lib/seo/og-image";

export const alt = "Free UUID v4 generator by RunExe";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    kicker: "Free tool",
    title: "UUID Generator",
    subtitle: "Random v4 UUIDs, one or a thousand at a time.",
  });
}
