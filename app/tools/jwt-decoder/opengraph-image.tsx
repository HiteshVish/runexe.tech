import { ogContentType, ogSize, renderOgImage } from "@/lib/seo/og-image";

export const alt = "Free JWT decoder by RunExe";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    kicker: "Free tool",
    title: "JWT Decoder",
    subtitle: "Read the header, payload and expiry of any token. Nothing is uploaded.",
  });
}
