import { PDFDocument } from "pdf-lib";
import { loadPdfDocument, renderPageToCanvas } from "../engines/pdfjs-loader";

export type CompressPreset = "lossless" | "high" | "balanced" | "maximum" | "target";

export type CompressResult = {
  bytes: Uint8Array;
  originalSize: number;
  outputSize: number;
  reductionPct: number;
  targetMet: boolean | null;
  note: string;
  rasterized: boolean;
};

async function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
  if (!blob) throw new Error("Could not encode page image.");
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Real compression via page rasterization + JPEG re-embed.
 * Lossless: pdf-lib rewrite with object streams only (limited savings).
 * Other presets: rasterize each page (explicitly quality-reducing).
 */
export async function compressPdf(
  source: Uint8Array,
  preset: CompressPreset,
  targetBytes?: number,
  onProgress?: (p: number) => void,
): Promise<CompressResult> {
  const originalSize = source.byteLength;

  if (preset === "lossless") {
    const doc = await PDFDocument.load(source);
    const bytes = await doc.save({ useObjectStreams: true });
    return {
      bytes,
      originalSize,
      outputSize: bytes.byteLength,
      reductionPct: Math.max(0, (1 - bytes.byteLength / originalSize) * 100),
      targetMet: targetBytes ? bytes.byteLength <= targetBytes : null,
      note: "Structural optimization only — limited size reduction without re-encoding images.",
      rasterized: false,
    };
  }

  const scaleMap = { high: 1.5, balanced: 1.1, maximum: 0.75, target: 1.0 } as const;
  const qualityMap = { high: 0.85, balanced: 0.72, maximum: 0.45, target: 0.7 } as const;
  let scale = scaleMap[preset === "target" ? "target" : preset];
  let quality = qualityMap[preset === "target" ? "target" : preset];

  const attempts: { scale: number; quality: number }[] = [{ scale, quality }];
  if (preset === "target" && targetBytes) {
    attempts.push(
      { scale: 0.9, quality: 0.6 },
      { scale: 0.75, quality: 0.5 },
      { scale: 0.6, quality: 0.4 },
      { scale: 0.5, quality: 0.35 },
    );
  }

  let best: CompressResult | null = null;

  for (const attempt of attempts) {
    const out = await PDFDocument.create();
    const pdfjsDoc = await loadPdfDocument(source);
    const pageCount = pdfjsDoc.numPages;

    for (let i = 0; i < pageCount; i++) {
      onProgress?.(i / pageCount);
      const page = await pdfjsDoc.getPage(i + 1);
      const vp = page.getViewport({ scale: 1 });
      const canvas = document.createElement("canvas");
      await renderPageToCanvas(pdfjsDoc, i, attempt.scale, canvas);
      const jpeg = await canvasToJpeg(canvas, attempt.quality);
      const img = await out.embedJpg(jpeg);
      const p = out.addPage([vp.width, vp.height]);
      p.drawImage(img, { x: 0, y: 0, width: vp.width, height: vp.height });
    }

    const bytes = await out.save({ useObjectStreams: true });
    const result: CompressResult = {
      bytes,
      originalSize,
      outputSize: bytes.byteLength,
      reductionPct: Math.max(0, (1 - bytes.byteLength / originalSize) * 100),
      targetMet: targetBytes ? bytes.byteLength <= targetBytes : null,
      note:
        "Pages were rasterized to JPEG. Searchable text, links, and forms may be removed. This is not lossless.",
      rasterized: true,
    };
    best = result;
    if (targetBytes && bytes.byteLength <= targetBytes) break;
    if (preset !== "target") break;
  }

  onProgress?.(1);
  if (!best) throw new Error("Compression failed.");
  if (targetBytes && !best.targetMet) {
    best.note += ` Closest size: ${(best.outputSize / 1024).toFixed(0)} KB (target ${(targetBytes / 1024).toFixed(0)} KB).`;
  }
  return best;
}