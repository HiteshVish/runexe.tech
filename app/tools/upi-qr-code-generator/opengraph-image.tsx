import { ogContentType, ogSize, renderOgImage } from "@/lib/seo/og-image";

export const alt = "UPI QR code generator by RunExe";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    kicker: "Free tool",
    title: "UPI QR Code Generator",
    subtitle: "Shop QR codes. Browser-only. No signup.",
  });
}