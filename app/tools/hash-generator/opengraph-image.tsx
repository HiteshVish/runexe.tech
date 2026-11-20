import { ogContentType, ogSize, renderOgImage } from "@/lib/seo/og-image";

export const alt = "Free SHA hash generator by RunExe";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    kicker: "Free tool",
    title: "Hash Generator",
    subtitle: "SHA-1, SHA-256, SHA-384 and SHA-512 for text or files.",
  });
}
