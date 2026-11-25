import { ogContentType, ogSize, renderOgImage } from "@/lib/seo/og-image";

export const alt = "WhatsApp QR code generator by RunExe";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    kicker: "Free tool",
    title: "WhatsApp Link QR Generator",
    subtitle: "Chat link with optional message. Free and private.",
  });
}