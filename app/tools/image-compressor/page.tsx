import ImageCompressorApp from "@/components/tools/ImageCompressor/ImageCompressorApp";
import JsonLd, { faqPage, graph, toolApp } from "@/components/seo/JsonLd";
import ToolGuide from "@/components/seo/ToolGuide";
import {
  IMAGE_COMPRESSOR_DESCRIPTION,
  imageCompressorFaq,
  imageCompressorSections,
} from "@/lib/image/tool-content";
import { SITE_URL, pageMetadata } from "@/lib/seo/site";

export const metadata = pageMetadata({
  title: "Free Image Compressor & Resizer (No Upload) | RunExe",
  description: IMAGE_COMPRESSOR_DESCRIPTION,
  path: "/tools/image-compressor",
});

const appLd = toolApp("image-compressor", {
  description: IMAGE_COMPRESSOR_DESCRIPTION,
  category: "MultimediaApplication",
  features: [
    "Compress JPG, PNG, WebP",
    "Target file size (KB/MB)",
    "Resize presets and passport size",
    "Batch download as ZIP",
    "Runs entirely in the browser",
  ],
});

export default function ImageCompressorPage() {
  return (
    <>
      <JsonLd
        data={graph(appLd, faqPage(`${SITE_URL}/tools/image-compressor`, imageCompressorFaq))}
      />
      <ImageCompressorApp />
      <ToolGuide
        tool="image-compressor"
        intro="A free, privacy-first image compressor and resizer from RunExe Technology."
        sections={imageCompressorSections}
        faq={imageCompressorFaq}
      />
    </>
  );
}