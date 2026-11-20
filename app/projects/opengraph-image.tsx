import { ogContentType, ogSize, renderOgImage } from "@/lib/seo/og-image";

export const alt = "Projects shipped by RunExe Technology";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    kicker: "Selected work",
    title: "Products we've shipped.",
    subtitle: "Healthcare, hospitality and fintech platforms in India and Hong Kong.",
  });
}
