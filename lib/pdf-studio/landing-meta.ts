import type { StudioMode } from "./constants";

export type PdfLandingSlug =
  | "merge-pdf"
  | "split-pdf"
  | "organize-pdf"
  | "rotate-pdf"
  | "remove-pdf-pages"
  | "sign-pdf"
  | "add-text-to-pdf"
  | "watermark-pdf"
  | "compress-pdf"
  | "jpg-to-pdf"
  | "pdf-to-jpg"
  | "crop-pdf";

export const PDF_LANDING_SLUGS: PdfLandingSlug[] = [
  "merge-pdf",
  "split-pdf",
  "organize-pdf",
  "rotate-pdf",
  "remove-pdf-pages",
  "sign-pdf",
  "add-text-to-pdf",
  "watermark-pdf",
  "compress-pdf",
  "jpg-to-pdf",
  "pdf-to-jpg",
  "crop-pdf",
];

const META: Record<
  PdfLandingSlug,
  { title: string; description: string; h1: string; lead: string; mode: StudioMode }
> = {
  "merge-pdf": {
    title: "Merge PDF Online Free | RunExe PDF Studio",
    description: "Combine multiple PDF files into one. Reorder pages and download — browser-only, no upload.",
    h1: "Merge PDF",
    lead: "Select multiple PDFs, reorder pages, and download a single combined file. Private browser processing.",
    mode: "merge",
  },
  "split-pdf": {
    title: "Split PDF Online Free | RunExe PDF Studio",
    description: "Split a PDF by ranges, every page, or every N pages. Download separate PDFs or a ZIP.",
    h1: "Split PDF",
    lead: "Extract page ranges or split every page. Download individually or as a ZIP — nothing is uploaded.",
    mode: "split",
  },
  "organize-pdf": {
    title: "Organize PDF Pages Free | RunExe PDF Studio",
    description: "Reorder, rotate, duplicate and delete PDF pages in your browser. Download the result.",
    h1: "Organize PDF",
    lead: "Drag pages to reorder, rotate, duplicate or delete — then export a clean PDF.",
    mode: "organize",
  },
  "rotate-pdf": {
    title: "Rotate PDF Pages Free | RunExe PDF Studio",
    description: "Rotate PDF pages clockwise or counterclockwise. Batch-select pages. Browser-only.",
    h1: "Rotate PDF",
    lead: "Fix sideways pages with one click. Select multiple pages and rotate together.",
    mode: "rotate",
  },
  "remove-pdf-pages": {
    title: "Remove PDF Pages Free | RunExe PDF Studio",
    description: "Delete unwanted PDF pages and download a cleaned file. Runs in your browser.",
    h1: "Remove PDF pages",
    lead: "Select pages to delete and export a shorter PDF. Your file never leaves this device.",
    mode: "remove-pages",
  },
  "sign-pdf": {
    title: "Sign PDF Online Free | RunExe PDF Studio",
    description: "Add an electronic signature — draw, type or upload. Place and download. Not a certificate signature.",
    h1: "Sign PDF",
    lead: "Draw, type or upload an electronic signature, place it on the page, and download.",
    mode: "sign",
  },
  "add-text-to-pdf": {
    title: "Add Text to PDF Free | RunExe PDF Studio",
    description: "Insert editable text overlays on any PDF page. Move, style and export in your browser.",
    h1: "Add text to PDF",
    lead: "Click to place text, style it, and export. Overlay text — not original content-stream editing.",
    mode: "add-text",
  },
  "watermark-pdf": {
    title: "Watermark PDF Free | RunExe PDF Studio",
    description: "Add text watermarks with opacity, rotation and position. Apply to all or selected pages.",
    h1: "Watermark PDF",
    lead: "Stamp a text watermark across pages with live preview, then download.",
    mode: "watermark",
  },
  "compress-pdf": {
    title: "Compress PDF Free | RunExe PDF Studio",
    description: "Reduce PDF file size with quality presets or a target size. See real before/after sizes.",
    h1: "Compress PDF",
    lead: "Choose a quality preset or target size. Raster modes are labeled clearly — we never fake compression.",
    mode: "compress",
  },
  "jpg-to-pdf": {
    title: "JPG to PDF Free | RunExe PDF Studio",
    description: "Convert images to a multi-page PDF. Order, margins and page size — browser-only.",
    h1: "JPG to PDF",
    lead: "Drop JPG, PNG or WebP images, reorder them, and download a PDF.",
    mode: "image-to-pdf",
  },
  "pdf-to-jpg": {
    title: "PDF to JPG Free | RunExe PDF Studio",
    description: "Convert PDF pages to JPG, PNG or WebP. Download individually or as a ZIP.",
    h1: "PDF to JPG",
    lead: "Render pages to images at your chosen resolution and download.",
    mode: "pdf-to-image",
  },
  "crop-pdf": {
    title: "Crop PDF Free | RunExe PDF Studio",
    description: "Crop PDF page margins visually. Changing crop boxes does not securely erase hidden content.",
    h1: "Crop PDF",
    lead: "Adjust page crop boxes and export. Note: cropping alone does not permanently remove hidden content.",
    mode: "crop",
  },
};

export function pdfLandingMeta(slug: PdfLandingSlug) {
  const m = META[slug];
  return { ...m, path: `/tools/${slug}` };
}