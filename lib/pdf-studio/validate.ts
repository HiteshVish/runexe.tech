import { MAX_FILE_BYTES, PDF_MAGIC, WARN_FILE_BYTES } from "./constants";

export type ValidateResult =
  | { ok: true; warning?: string }
  | { ok: false; error: string; encrypted?: boolean };

export function hasPdfMagic(bytes: Uint8Array): boolean {
  if (bytes.length < 5) return false;
  // Allow leading whitespace / BOM before %PDF
  const limit = Math.min(1024, bytes.length - 4);
  for (let i = 0; i < limit; i++) {
    if (
      bytes[i] === PDF_MAGIC[0] &&
      bytes[i + 1] === PDF_MAGIC[1] &&
      bytes[i + 2] === PDF_MAGIC[2] &&
      bytes[i + 3] === PDF_MAGIC[3]
    ) {
      return true;
    }
  }
  return false;
}

export function looksEncrypted(bytes: Uint8Array): boolean {
  // Heuristic: /Encrypt dictionary in early trailer region
  const sample = bytes.slice(0, Math.min(bytes.length, 512 * 1024));
  const text = new TextDecoder("latin1").decode(sample);
  return /\/Encrypt[\s\/]/.test(text);
}

export function validatePdfBytes(bytes: Uint8Array, fileName?: string): ValidateResult {
  if (!bytes.length) {
    return { ok: false, error: "This file is empty." };
  }
  if (bytes.length > MAX_FILE_BYTES) {
    return {
      ok: false,
      error: `${fileName ?? "File"} is larger than ${Math.round(MAX_FILE_BYTES / (1024 * 1024))} MB. Choose a smaller PDF.`,
    };
  }
  if (!hasPdfMagic(bytes)) {
    return { ok: false, error: "This does not look like a valid PDF file." };
  }
  if (looksEncrypted(bytes)) {
    return {
      ok: false,
      error: "This PDF appears password-protected. Unlock is not available in the browser yet.",
      encrypted: true,
    };
  }
  const warning =
    bytes.length > WARN_FILE_BYTES
      ? "Large PDF — editing may be slow on this device."
      : undefined;
  return { ok: true, warning };
}

export async function readFileBytes(file: File): Promise<Uint8Array> {
  const buf = await file.arrayBuffer();
  return new Uint8Array(buf);
}