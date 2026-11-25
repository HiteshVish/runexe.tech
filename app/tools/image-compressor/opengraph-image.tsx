import { ogContentType, ogSize, renderOgImage } from "@/lib/seo/og-image";

export const alt = "Free image compressor and resizer by RunExe";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    kicker: "Free tool",
    title: "Image Compressor & Resizer",
    subtitle: "JPG, PNG, WebP. Target size & resize. Runs in your browser.",
  });
}