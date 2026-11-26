import { ogContentType, ogSize, renderOgImage } from "@/lib/seo/og-image";

export const alt = "Free Internet Speed Test by RunExe";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    kicker: "Free tool",
    title: "Internet Speed Test",
    subtitle: "Download, upload, ping, jitter and bufferbloat — no signup.",
  });
}
