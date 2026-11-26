import type { PdfLandingSlug } from "./landing-meta";

export const PDF_STUDIO_DESCRIPTION =
  "Edit, organize, merge, split and sign PDFs in your browser with RunExe PDF Studio. Free — no signup, no upload, no watermarks on exports. Private canvas-first editor.";

export const pdfSections = [
  {
    heading: "What you can do",
    body: "Open PDFs locally, reorder and rotate pages, add text and images, draw annotations, place an electronic signature, apply watermarks and page numbers, then download a valid PDF. Everything runs in your browser.",
  },
  {
    heading: "Privacy first",
    body: "PDF Studio does not upload your documents to RunExe servers. Processing stays in your tab. Close the tab to discard the session. We do not log file names or document contents.",
  },
  {
    heading: "Whiteout vs redaction",
    body: "Whiteout covers content visually. It is not secure redaction — hidden text may still exist. True permanent redaction is not offered yet.",
  },
];

export const pdfFaq = [
  {
    q: "Is RunExe PDF Studio free?",
    a: "Yes. Core editing, merge, split, signatures and export are free with no mandatory signup and no forced watermarks.",
  },
  {
    q: "Do you upload my PDF?",
    a: "No. PDF Studio processes files in your browser. Nothing is sent to our servers for these tools.",
  },
  {
    q: "Can I edit original PDF text?",
    a: "You can add new text overlays. Editing the original content stream of arbitrary PDFs is not supported — overlay text is not the same as rewriting embedded text.",
  },
  {
    q: "Are electronic signatures the same as digital signatures?",
    a: "No. Drawn, typed or uploaded signatures are electronic signatures for appearance. Certificate-based cryptographic signatures are not available yet.",
  },
  {
    q: "Why can’t I open a password-protected PDF?",
    a: "Unlock and protect need a dedicated encryption engine. We do not bypass permissions or crack passwords.",
  },
];

export type LandingContent = {
  sections: { heading: string; body: string }[];
  faq: { q: string; a: string }[];
  howTo: { name: string; steps: string[] };
  features: string[];
};

const PRIVACY =
  "Runs entirely in your browser. RunExe does not upload your file for this tool and does not store document contents.";

export const LANDING_CONTENT: Record<PdfLandingSlug, LandingContent> = {
  "merge-pdf": {
    features: ["Combine PDFs", "Reorder pages", "Browser-only", "Free download"],
    howTo: {
      name: "How to merge PDFs",
      steps: [
        "Select or drop two or more PDF files.",
        "Reorder pages in the left filmstrip if needed.",
        "Click Download to save one combined PDF.",
      ],
    },
    sections: [
      {
        heading: "Merge without uploading",
        body: `Combine multiple PDFs into one file on your device. ${PRIVACY}`,
      },
      {
        heading: "Control page order",
        body: "Drag pages in the filmstrip before export so the downloaded file matches what you see.",
      },
      {
        heading: "When to use merge",
        body: "Useful for contracts, scanned packets, and combining invoices or reports into a single download.",
      },
    ],
    faq: [
      { q: "Can I merge more than two PDFs?", a: "Yes. Add multiple files; all pages are combined in order, then you can reorder before download." },
      { q: "Is my PDF uploaded?", a: PRIVACY },
      { q: "Will merge keep page sizes?", a: "Each page keeps its original dimensions from the source PDF when exported." },
      { q: "Can I remove pages while merging?", a: "Yes. Select pages in the filmstrip and delete them before downloading." },
    ],
  },
  "split-pdf": {
    features: ["Page ranges", "Split every page", "ZIP download", "Browser-only"],
    howTo: {
      name: "How to split a PDF",
      steps: ["Open a PDF.", "Enter ranges like 1-3, 5 or choose every page / every N.", "Download a PDF or ZIP of parts."],
    },
    sections: [
      { heading: "Split by ranges", body: `Extract pages with ranges such as 1-3, 5, 8-10. ${PRIVACY}` },
      { heading: "Bulk splits", body: "Split every page or every N pages into separate files packaged as a ZIP." },
      { heading: "Invalid ranges", body: "Out-of-range or empty selections show a clear error instead of a broken download." },
    ],
    faq: [
      { q: "What range formats work?", a: "Use commas and hyphens, for example 1-3, 5, 8-10. Numbers are 1-based." },
      { q: "Can I download a ZIP?", a: "Yes when splitting into multiple files (every page or every N pages)." },
      { q: "Is splitting private?", a: PRIVACY },
      { q: "Does split change quality?", a: "Pages are copied from the source PDF; we do not rasterize during a normal split." },
    ],
  },
  "organize-pdf": {
    features: ["Reorder", "Rotate", "Duplicate", "Delete pages"],
    howTo: {
      name: "How to organize PDF pages",
      steps: ["Open a PDF.", "Drag pages to reorder; rotate, duplicate or delete as needed.", "Download the result."],
    },
    sections: [
      { heading: "Visual page management", body: `Drag the filmstrip to reorder. Rotate, duplicate, insert blank pages, then export. ${PRIVACY}` },
      { heading: "Matches the preview", body: "The downloaded PDF page order matches the filmstrip." },
    ],
    faq: [
      { q: "Can I insert a blank page?", a: "Yes — use the + control on the page filmstrip." },
      { q: "Can I undo?", a: "Yes. Use Undo in the app bar or Ctrl/Cmd+Z." },
      { q: "Is organize browser-only?", a: PRIVACY },
    ],
  },
  "rotate-pdf": {
    features: ["Rotate CW/CCW", "Multi-select", "Browser-only"],
    howTo: {
      name: "How to rotate PDF pages",
      steps: ["Open a PDF.", "Select one or more pages.", "Rotate clockwise or counterclockwise, then download."],
    },
    sections: [
      { heading: "Fix sideways pages", body: `Rotate selected pages without uploading. ${PRIVACY}` },
      { heading: "Batch rotate", body: "Select multiple pages in the filmstrip and rotate them together." },
    ],
    faq: [
      { q: "Does rotation affect export?", a: "Yes. Page rotation is applied in the downloaded PDF." },
      { q: "Can I rotate only some pages?", a: "Yes — multi-select pages first." },
      { q: "Private?", a: PRIVACY },
    ],
  },
  "remove-pdf-pages": {
    features: ["Delete pages", "Extract keepers", "Browser-only"],
    howTo: {
      name: "How to remove PDF pages",
      steps: ["Open a PDF.", "Select pages to delete in the filmstrip.", "Download the shortened PDF."],
    },
    sections: [
      { heading: "Delete unwanted pages", body: `Select and delete pages, then export. You must keep at least one page. ${PRIVACY}` },
      { heading: "Extract instead", body: "Prefer keeping ranges? Use Split with page ranges to extract what you need." },
    ],
    faq: [
      { q: "Can I delete all pages?", a: "No. At least one page must remain." },
      { q: "Is content uploaded?", a: PRIVACY },
    ],
  },
  "sign-pdf": {
    features: ["Draw signature", "Upload image", "Place and resize", "Electronic only"],
    howTo: {
      name: "How to sign a PDF",
      steps: ["Open a PDF.", "Draw or upload a signature in the side panel.", "Place it on the page, resize, then download."],
    },
    sections: [
      {
        heading: "Electronic signature",
        body: `Draw, or upload a PNG/JPEG signature image, then place it on the page. This is an electronic signature for appearance — not a certificate-based digital signature. ${PRIVACY}`,
      },
      {
        heading: "Not a digital certificate",
        body: "Cryptographic / certificate signing is not available. Editing a digitally signed PDF elsewhere may invalidate that signature.",
      },
    ],
    faq: [
      { q: "Is this a legally binding digital signature?", a: "This tool provides an electronic signature image/overlay. It does not create certificate-based digital signatures." },
      { q: "Can I upload a signature image?", a: "Yes — PNG, JPEG or WebP." },
      { q: "Where is my signature stored?", a: "Only in the current browser session unless you save a signature yourself. We do not upload it." },
      { q: "Private?", a: PRIVACY },
    ],
  },
  "add-text-to-pdf": {
    features: ["Text overlays", "Fonts", "Move and style", "Browser-only"],
    howTo: {
      name: "How to add text to a PDF",
      steps: ["Open a PDF.", "Choose the Text tool and click the page.", "Style text in properties, then download."],
    },
    sections: [
      {
        heading: "Overlay text",
        body: `Click to place text, then move and style it. This adds overlays — it does not rewrite original embedded text runs. ${PRIVACY}`,
      },
      {
        heading: "Fonts on export",
        body: "Standard PDF fonts (Helvetica, Times, Courier variants) are embedded on export for reliable rendering.",
      },
    ],
    faq: [
      { q: "Is this the same as editing original PDF text?", a: "No. You add new text overlays. Original content-stream editing is not supported." },
      { q: "Unicode support?", a: "Standard fonts cover common Latin glyphs; complex scripts may need image-based workarounds." },
      { q: "Private?", a: PRIVACY },
    ],
  },
  "watermark-pdf": {
    features: ["Text watermark", "Opacity", "All pages", "Browser-only"],
    howTo: {
      name: "How to watermark a PDF",
      steps: ["Open a PDF.", "Enter watermark text in the panel.", "Apply and download."],
    },
    sections: [
      { heading: "Stamp every page", body: `Add a semi-transparent text watermark across pages. ${PRIVACY}` },
      { heading: "Live placement", body: "Adjust opacity and position before export." },
    ],
    faq: [
      { q: "Can I use an image watermark?", a: "Use Add image for logos; the watermark panel focuses on text stamps." },
      { q: "Private?", a: PRIVACY },
    ],
  },
  "compress-pdf": {
    features: ["Quality presets", "Target size", "Real size report", "Honest raster labeling"],
    howTo: {
      name: "How to compress a PDF",
      steps: ["Open a PDF.", "Choose lossless or a raster quality / target size.", "Download and review the before/after sizes."],
    },
    sections: [
      {
        heading: "Real compression",
        body: `Lossless mode rewrites structure. Other presets rasterize pages to JPEG — labeled clearly because text may stop being selectable. ${PRIVACY}`,
      },
      {
        heading: "Target size",
        body: "We try progressive settings toward your target. Exact size is never guaranteed; you get the closest valid output and a clear note.",
      },
    ],
    faq: [
      { q: "Will text stay searchable?", a: "Lossless mode aims to preserve text. Raster presets may remove searchable text and links." },
      { q: "Can you hit exactly 100 KB?", a: "No. We never promise an exact size; we report whether the target was met." },
      { q: "Private?", a: PRIVACY },
    ],
  },
  "jpg-to-pdf": {
    features: ["Multi-image", "A4 pages", "Order images", "Browser-only"],
    howTo: {
      name: "How to convert images to PDF",
      steps: ["Select JPG, PNG or WebP images.", "We build one page per image on A4.", "Download the PDF."],
    },
    sections: [
      { heading: "Images to PDF", body: `Convert photos or scans into a multi-page PDF in your browser. ${PRIVACY}` },
    ],
    faq: [
      { q: "Which formats?", a: "JPEG, PNG and WebP." },
      { q: "Private?", a: PRIVACY },
    ],
  },
  "pdf-to-jpg": {
    features: ["Page to JPG", "ZIP download", "Browser-only"],
    howTo: {
      name: "How to convert PDF to JPG",
      steps: ["Open a PDF.", "Use PDF to images in the panel.", "Download a ZIP of JPG pages."],
    },
    sections: [
      { heading: "PDF pages as images", body: `Render pages to JPG and download as a ZIP. ${PRIVACY}` },
    ],
    faq: [
      { q: "PNG or WebP?", a: "The current export packages JPEG pages in a ZIP for broad compatibility." },
      { q: "Private?", a: PRIVACY },
    ],
  },
  "crop-pdf": {
    features: ["Crop guide", "Export crop box", "Disclosure"],
    howTo: {
      name: "How to crop a PDF",
      steps: ["Open a PDF.", "Set a margin crop in the panel.", "Download — the crop box is applied on export."],
    },
    sections: [
      {
        heading: "Crop with a clear caveat",
        body: `Crop sets a crop box inset. It does not permanently erase hidden content outside the visible area. ${PRIVACY}`,
      },
    ],
    faq: [
      { q: "Does crop securely remove content?", a: "No. Cropping alone does not securely erase hidden content." },
      { q: "Private?", a: PRIVACY },
    ],
  },
};

export function landingContent(slug: PdfLandingSlug): LandingContent {
  return LANDING_CONTENT[slug];
}