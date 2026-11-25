import type { GuideFaq, GuideSection } from "@/components/seo/ToolGuide";

export const IMAGE_COMPRESSOR_DESCRIPTION =
  "Compress and resize JPG, PNG and WebP images in your browser. Target file size, presets, batch ZIP — nothing is uploaded.";

export const imageCompressorSections: GuideSection[] = [
  {
    heading: "What it does",
    body: "Shrink photos by quality or target file size (KB/MB), resize with presets including passport dimensions, convert between JPG, PNG and WebP, and download one file or a ZIP batch.",
  },
  {
    heading: "Privacy",
    body: "All processing uses the Canvas API in your tab. Images are not sent to RunExe servers. Re-encoding strips EXIF metadata (location, camera tags) by default.",
  },
  {
    heading: "How to use it",
    ordered: true,
    list: [
      "Upload images by drag-and-drop, browse, or paste.",
      "Choose Quality or Target size, adjust resize and output format.",
      "Adjust quality or size — the preview updates automatically, then download.",
    ],
  },
];

export const imageCompressorFaq: GuideFaq[] = [
  {
    q: "Is my image uploaded?",
    a: "No. Compression and resizing happen in your browser with the Canvas API. Files never leave your device.",
  },
  {
    q: "How do I compress an image to under 50 KB?",
    a: "Choose Target size mode, pick the 50 KB preset (or enter 50 KB), and select JPG or WebP. The preview refreshes on its own. If the target is hard to reach, the tool downsizes dimensions and shows the closest result.",
  },
  {
    q: "Why is my PNG not getting smaller?",
    a: "PNG is lossless, so quality sliders do not apply. Use JPG or WebP for smaller files, or reduce dimensions.",
  },
  {
    q: "What size is a passport photo?",
    a: "Many countries use 35×45 mm. At 300 DPI that is 413×531 pixels — use the passport preset in the resize section.",
  },
];