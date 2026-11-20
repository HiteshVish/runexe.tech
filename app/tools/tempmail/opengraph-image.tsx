import { ogContentType, ogSize, renderOgImage } from "@/lib/seo/og-image";

export const alt = "Free temporary email generator by RunExe";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    kicker: "Free tool",
    title: "Temporary Email Generator",
    subtitle: "A disposable inbox for testing and sign-ups. No signup needed.",
  });
}
