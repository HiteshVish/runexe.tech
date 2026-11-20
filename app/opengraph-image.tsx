import { ogContentType, ogSize, renderOgImage } from "@/lib/seo/og-image";

export const alt = "RunExe Technology — custom software and AI studio";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    kicker: "Software engineering studio",
    title: "We build software that executes.",
    subtitle: "Custom platforms, AI automation, mobile apps and cloud products.",
  });
}
