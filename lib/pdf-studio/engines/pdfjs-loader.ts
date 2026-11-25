import type { PDFDocumentProxy } from "pdfjs-dist";

let loading: Promise<typeof import("pdfjs-dist")> | null = null;

export async function getPdfJs() {
  if (typeof window === "undefined") {
    throw new Error("PDF.js is only available in the browser.");
  }
  if (!loading) {
    loading = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return pdfjs;
    });
  }
  return loading;
}

export async function loadPdfDocument(bytes: Uint8Array): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfJs();
  const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const task = pdfjs.getDocument({
    data,
    disableAutoFetch: true,
    disableStream: true,
    isEvalSupported: false,
    useSystemFonts: true,
  });
  return task.promise;
}

export async function renderPageToCanvas(
  doc: PDFDocumentProxy,
  pageIndex: number,
  scale: number,
  canvas: HTMLCanvasElement,
  signal?: AbortSignal,
): Promise<{ width: number; height: number }> {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const page = await doc.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale });
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable.");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(viewport.width * dpr);
  canvas.height = Math.floor(viewport.height * dpr);
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // pdfjs types vary by version — canvasContext + viewport is the stable API
  const task = page.render({ canvasContext: ctx, viewport } as Parameters<typeof page.render>[0]);
  if (signal) {
    signal.addEventListener("abort", () => task.cancel(), { once: true });
  }
  await task.promise;
  return { width: viewport.width, height: viewport.height };
}

export async function renderThumb(
  doc: PDFDocumentProxy,
  pageIndex: number,
  maxWidth = 120,
): Promise<string> {
  const page = await doc.getPage(pageIndex + 1);
  const base = page.getViewport({ scale: 1 });
  const scale = maxWidth / base.width;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable.");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  await page.render({ canvasContext: ctx, viewport } as Parameters<typeof page.render>[0]).promise;
  return canvas.toDataURL("image/jpeg", 0.72);
}