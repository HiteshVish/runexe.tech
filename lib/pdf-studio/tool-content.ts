export const PDF_STUDIO_DESCRIPTION =
  "Edit, organize, merge, split and sign PDFs in your browser. Free RunExe PDF Studio — no signup, no upload, no watermarks on exports.";

export const pdfSections = [
  {
    heading: "What you can do",
    body: "Open one or more PDFs, reorder and rotate pages, add text and images, draw annotations, place an electronic signature, apply watermarks and page numbers, then download a valid PDF. Everything runs locally in your browser.",
  },
  {
    heading: "Privacy",
    body: "Your documents are not uploaded to RunExe servers for PDF Studio. Processing stays in your tab. Close the tab to discard the session. We do not log file names or document contents.",
  },
  {
    heading: "Whiteout vs redaction",
    body: "The whiteout tool covers content visually. It is not secure redaction — hidden text may still exist in the file. True redaction requires a permanent content-removal engine and is not offered yet.",
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
    a: "You can add new text overlays. Editing the original content stream of arbitrary PDFs is not supported yet — we do not pretend whiteout plus new text is the same as editing original text.",
  },
  {
    q: "Are electronic signatures the same as digital signatures?",
    a: "No. Drawn, typed or uploaded signatures are electronic signatures for appearance. Certificate-based cryptographic signatures are a separate feature and are not available yet.",
  },
  {
    q: "Why can’t I open a password-protected PDF?",
    a: "Unlock/protect need a dedicated encryption engine. We do not bypass permissions or crack passwords. Those tools stay unpublished until a secure implementation is ready.",
  },
];