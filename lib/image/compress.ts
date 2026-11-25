import {
  INPUT_MIME_TYPES,
  MAX_SAFE_EDGE,
  OUTPUT_EXT,
  OUTPUT_MIME,
  UNSUPPORTED_MIME_HINT,
  type FitMode,
  type OutputFormat,
} from "./constants";
import { detectWebpEncodeSupport } from "./formats";

export type LoadedImage = {
  bitmap: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  revoke?: () => void;
};

export type DrawOptions = {
  targetWidth: number;
  targetHeight: number;
  fit: FitMode;
  backgroundColor: string;
  outputFormat: OutputFormat;
};

export type ProcessSettings = {
  compressionMode: "quality" | "target";
  quality: number;
  targetBytes: number | null;
  resizeWidth: number | null;
  resizeHeight: number | null;
  lockAspect: boolean;
  scalePercent: number | null;
  fit: FitMode;
  backgroundColor: string;
  outputFormat: OutputFormat;
};

export type ProcessResult = {
  blob: Blob;
  width: number;
  height: number;
  mime: string;
  note?: string;
  usedOriginal?: boolean;
};

export function validateFile(file: File): string | null {
  if (!file || file.size === 0) return "This file is empty or could not be read.";
  const type = (file.type || "").toLowerCase();
  if (type === UNSUPPORTED_MIME_HINT || type.startsWith("image/gif")) {
    return "Animated GIF is not supported. Use JPG, PNG or WebP.";
  }
  if (!INPUT_MIME_TYPES.includes(type as (typeof INPUT_MIME_TYPES)[number])) {
    return "Unsupported format. Use JPG, PNG or WebP.";
  }
  return null;
}

/** Load with EXIF orientation; strips metadata when re-drawn on canvas. */
export async function loadImageSource(file: File): Promise<LoadedImage> {
  const err = validateFile(file);
  if (err) throw new Error(err);

  const objectUrl = URL.createObjectURL(file);
  const revoke = () => URL.revokeObjectURL(objectUrl);

  try {
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        bitmap,
        width: bitmap.width,
        height: bitmap.height,
        revoke: () => {
          bitmap.close();
          revoke();
        },
      };
    }
  } catch {
    /* fallback below */
  }

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("This image could not be decoded."));
    el.src = objectUrl;
  });
  return { bitmap: img, width: img.naturalWidth, height: img.naturalHeight, revoke };
}

function clampDimension(n: number): number {
  return Math.max(1, Math.round(n));
}

/** Cap extreme dimensions before encoding to reduce memory use. */
export function capDimensions(width: number, height: number, maxEdge = MAX_SAFE_EDGE): { width: number; height: number } {
  const edge = Math.max(width, height);
  if (edge <= maxEdge) return { width, height };
  const scale = maxEdge / edge;
  return {
    width: clampDimension(width * scale),
    height: clampDimension(height * scale),
  };
}

export function resolveOutputDimensions(
  srcW: number,
  srcH: number,
  settings: ProcessSettings,
): { width: number; height: number } {
  let w = srcW;
  let h = srcH;

  if (settings.scalePercent && settings.scalePercent > 0) {
    const s = settings.scalePercent / 100;
    w = clampDimension(w * s);
    h = clampDimension(h * s);
  }

  const rw = settings.resizeWidth;
  const rh = settings.resizeHeight;
  if (rw || rh) {
    if (settings.lockAspect) {
      if (rw && rh) {
        w = rw;
        h = rh;
      } else if (rw) {
        w = rw;
        h = clampDimension((srcH / srcW) * rw);
      } else if (rh) {
        h = rh;
        w = clampDimension((srcW / srcH) * rh);
      }
    } else {
      w = rw ?? w;
      h = rh ?? h;
    }
  }

  return capDimensions(w, h);
}

function drawImageToCanvas(
  source: ImageBitmap | HTMLImageElement,
  sw: number,
  sh: number,
  opts: DrawOptions,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = clampDimension(opts.targetWidth);
  canvas.height = clampDimension(opts.targetHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");

  const needsBg =
    opts.outputFormat === "jpeg" ||
    (opts.fit === "contain" && (canvas.width !== sw || canvas.height !== sh));
  if (needsBg) {
    ctx.fillStyle = opts.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (opts.fit === "contain") {
    const scale = Math.min(canvas.width / sw, canvas.height / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    const dx = (canvas.width - dw) / 2;
    const dy = (canvas.height - dh) / 2;
    ctx.drawImage(source, 0, 0, sw, sh, dx, dy, dw, dh);
  } else {
    const scale = Math.max(canvas.width / sw, canvas.height / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    const sx = (dw - canvas.width) / 2 / scale;
    const sy = (dh - canvas.height) / 2 / scale;
    const sww = canvas.width / scale;
    const shh = canvas.height / scale;
    ctx.drawImage(source, sx, sy, sww, shh, 0, 0, canvas.width, canvas.height);
  }

  return canvas;
}

export function encodeBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Encoding failed."));
        else resolve(blob);
      },
      mime,
      mime === OUTPUT_MIME.png ? undefined : quality,
    );
  });
}

export async function compressWithQuality(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  qualityPercent: number,
): Promise<Blob> {
  let fmt = format;
  let mime = OUTPUT_MIME[fmt];
  if (fmt === "webp" && !(await detectWebpEncodeSupport())) {
    fmt = "jpeg";
    mime = OUTPUT_MIME.jpeg;
  }
  const q = Math.min(1, Math.max(0.05, qualityPercent / 100));
  return encodeBlob(canvas, mime, q);
}

export async function compressToTargetSize(
  source: ImageBitmap | HTMLImageElement,
  srcW: number,
  srcH: number,
  settings: ProcessSettings,
  originalFileSize: number,
): Promise<ProcessResult> {
  if (settings.targetBytes != null && originalFileSize <= settings.targetBytes) {
    return {
      blob: new Blob(),
      width: srcW,
      height: srcH,
      mime: "",
      note: "Your file is already smaller than the target. Keeping the original size when you download.",
      usedOriginal: true,
    };
  }

  let fmt = settings.outputFormat;
  if (fmt === "webp" && !(await detectWebpEncodeSupport())) {
    fmt = "jpeg";
  }
  const mime = OUTPUT_MIME[fmt];
  const target = settings.targetBytes ?? 100 * 1024;
  const tolerance = Math.max(512, Math.round(target * 0.08));

  let dims = resolveOutputDimensions(srcW, srcH, settings);
  let bestBlob: Blob | null = null;
  let bestCanvas: HTMLCanvasElement | null = null as HTMLCanvasElement | null;
  let note: string | undefined;

  const tryAtDims = async (w: number, h: number): Promise<Blob | null> => {
    const canvas = drawImageToCanvas(source, srcW, srcH, {
      targetWidth: w,
      targetHeight: h,
      fit: settings.fit,
      backgroundColor: settings.backgroundColor,
      outputFormat: fmt,
    });

    if (fmt === "png") {
      const blob = await encodeBlob(canvas, mime);
      bestCanvas = canvas;
      return blob;
    }

    let lo = 0.05;
    let hi = 0.95;
    let closest: Blob | null = null;
    for (let i = 0; i < 8; i++) {
      const mid = (lo + hi) / 2;
      const blob = await encodeBlob(canvas, mime, mid);
      closest = blob;
      if (blob.size <= target + tolerance) {
        bestCanvas = canvas;
        if (blob.size >= target - tolerance) return blob;
        hi = mid;
      } else {
        lo = mid;
      }
    }
    bestCanvas = canvas;
    return closest;
  };

  for (let pass = 0; pass < 12; pass++) {
    const blob = await tryAtDims(dims.width, dims.height);
    if (!blob) break;
    bestBlob = blob;
    if (blob.size <= target + tolerance) break;
    dims = {
      width: clampDimension(dims.width * 0.9),
      height: clampDimension(dims.height * 0.9),
    };
    if (dims.width < 32 || dims.height < 32) {
      note = `Could not reach ${Math.round(target / 1024)} KB at this size. Download uses the closest result (${Math.round(blob.size / 1024)} KB).`;
      break;
    }
  }

  if (!bestBlob) throw new Error("Could not compress this image.");

  if (bestBlob.size > target + tolerance && !note) {
    note = `Target not fully reached. Closest size: about ${Math.round(bestBlob.size / 1024)} KB.`;
  }
  if (fmt === "png" && settings.compressionMode === "target") {
    note = (note ? note + " " : "") + "PNG ignores quality; try JPG or WebP, or reduce dimensions for a smaller file.";
  }

  return {
    blob: bestBlob,
    width: bestCanvas?.width ?? dims.width,
    height: bestCanvas?.height ?? dims.height,
    mime: bestBlob.type || mime,
    note,
  };
}

export async function processImage(
  file: File,
  settings: ProcessSettings,
): Promise<ProcessResult> {
  const loaded = await loadImageSource(file);
  try {
    const { bitmap, width, height } = loaded;

    if (settings.compressionMode === "target" && settings.targetBytes) {
      const targetResult = await compressToTargetSize(bitmap, width, height, settings, file.size);
      if (targetResult.usedOriginal) {
        return { blob: file, width, height, mime: file.type, note: targetResult.note, usedOriginal: true };
      }
      return targetResult;
    }

    const dims = resolveOutputDimensions(width, height, settings);
    const canvas = drawImageToCanvas(bitmap, width, height, {
      targetWidth: dims.width,
      targetHeight: dims.height,
      fit: settings.fit,
      backgroundColor: settings.backgroundColor,
      outputFormat: settings.outputFormat,
    });

    const blob = await compressWithQuality(canvas, settings.outputFormat, settings.quality);
    return {
      blob,
      width: canvas.width,
      height: canvas.height,
      mime: blob.type,
    };
  } finally {
    loaded.revoke?.();
  }
}

export function buildOutputFilename(originalName: string, format: OutputFormat): string {
  const base = originalName.replace(/\.[^.]+$/, "").replace(/[^\w.\-]+/g, "_") || "image";
  return `${base}-compressed.${OUTPUT_EXT[format]}`;
}