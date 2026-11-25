import { ogContentType, ogSize, renderOgImage } from "@/lib/seo/og-image";

export const alt = "Password generator by RunExe";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    kicker: "Free tool",
    title: "Password Generator",
    subtitle: "Secure random passwords. Runs in your browser.",
  });
}