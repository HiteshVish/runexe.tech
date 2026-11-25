/**
 * Phase 3 capabilities — gated. Do not publish UI routes until verified.
 * See docs/pdf-studio-status.md and capability-registry.ts.
 */
import { CAPABILITIES, type CapabilityId } from "./capability-registry";

export const PHASE3_IDS: CapabilityId[] = [
  "ocr",
  "edit-original-text",
  "secure-redaction",
  "pdf-to-word",
  "word-to-pdf",
  "compare",
  "cert-signature",
  "protect",
  "unlock",
];

export function phase3Status(): { id: CapabilityId; available: boolean; reason?: string }[] {
  return PHASE3_IDS.map((id) => {
    const c = CAPABILITIES[id];
    return { id, available: c.available, reason: c.reason };
  });
}

/** OCR entry point reserved for Tesseract.js worker — not wired until approved. */
export async function runOcrUnavailable(): Promise<never> {
  throw new Error(CAPABILITIES.ocr.reason ?? "OCR is not available yet.");
}