import { ogContentType, ogSize, renderOgImage } from "@/lib/seo/og-image";

export const alt = "WiFi QR code generator by RunExe";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    kicker: "Free tool",
    title: "WiFi QR Code Generator",
    subtitle: "Share network access with a scannable QR.",
  });
}