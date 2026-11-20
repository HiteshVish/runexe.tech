import { ogContentType, ogSize, renderOgImage } from "@/lib/seo/og-image";

export const alt = "Free Base64 encoder and decoder by RunExe";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    kicker: "Free tool",
    title: "Base64 Encoder & Decoder",
    subtitle: "UTF-8, URL-safe and file encoding. Runs in your browser.",
  });
}
