export type CapabilityId =
  | "merge"
  | "split"
  | "organize"
  | "rotate"
  | "overlays"
  | "signature"
  | "watermark"
  | "page-numbers"
  | "forms"
  | "compress"
  | "pdf-to-image"
  | "image-to-pdf"
  | "crop"
  | "metadata"
  | "protect"
  | "unlock"
  | "ocr"
  | "edit-original-text"
  | "secure-redaction"
  | "pdf-to-word"
  | "word-to-pdf"
  | "compare"
  | "cert-signature";

export type Capability = {
  id: CapabilityId;
  label: string;
  /** Published in UI and SEO */
  available: boolean;
  reason?: string;
};

export const CAPABILITIES: Record<CapabilityId, Capability> = {
  merge: { id: "merge", label: "Merge PDF", available: true },
  split: { id: "split", label: "Split PDF", available: true },
  organize: { id: "organize", label: "Organize pages", available: true },
  rotate: { id: "rotate", label: "Rotate pages", available: true },
  overlays: { id: "overlays", label: "Annotations & text", available: true },
  signature: { id: "signature", label: "Electronic signature", available: true },
  watermark: { id: "watermark", label: "Watermark", available: true },
  "page-numbers": { id: "page-numbers", label: "Page numbers", available: true },
  forms: { id: "forms", label: "Fill AcroForm fields", available: true },
  compress: { id: "compress", label: "Compress PDF", available: true },
  "pdf-to-image": { id: "pdf-to-image", label: "PDF to image", available: true },
  "image-to-pdf": { id: "image-to-pdf", label: "Image to PDF", available: true },
  crop: { id: "crop", label: "Crop PDF", available: true },
  metadata: { id: "metadata", label: "Metadata", available: true },
  protect: {
    id: "protect",
    label: "Protect PDF",
    available: false,
    reason: "No approved browser encryption engine yet (qpdf-WASM under evaluation).",
  },
  unlock: {
    id: "unlock",
    label: "Unlock PDF",
    available: false,
    reason: "Requires authorized decryption engine; pdf-lib ignoreEncryption is not supported.",
  },
  ocr: {
    id: "ocr",
    label: "OCR",
    available: false,
    reason: "Tesseract OCR gated until Phase 3 validation completes.",
  },
  "edit-original-text": {
    id: "edit-original-text",
    label: "Edit original text",
    available: false,
    reason: "Content-stream text editing not implemented; use Add text overlays.",
  },
  "secure-redaction": {
    id: "secure-redaction",
    label: "Secure redaction",
    available: false,
    reason: "Whiteout is visual cover only. Permanent redaction requires a verified rewrite engine.",
  },
  "pdf-to-word": {
    id: "pdf-to-word",
    label: "PDF to Word",
    available: false,
    reason: "No approved conversion engine.",
  },
  "word-to-pdf": {
    id: "word-to-pdf",
    label: "Word to PDF",
    available: false,
    reason: "No approved conversion engine.",
  },
  compare: {
    id: "compare",
    label: "Compare PDFs",
    available: false,
    reason: "Not implemented yet.",
  },
  "cert-signature": {
    id: "cert-signature",
    label: "Certificate digital signature",
    available: false,
    reason: "Separate from electronic (drawn) signatures; not implemented.",
  },
};

export function isAvailable(id: CapabilityId): boolean {
  return CAPABILITIES[id]?.available === true;
}