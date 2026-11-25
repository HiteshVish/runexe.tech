import QRCode from "qrcode";
import { normalizeHex, prepareScanColors } from "./contrast";
import type { EccLevel, QrCustomize } from "./types";

export type RenderOptions = QrCustomize & {
  payload: string;
  logo?: HTMLImageElement | null;
};

export type RenderColorMeta = { scanAdjusted: boolean; fg: string; bg: string };

export async function renderQrToCanvas(
  canvas: HTMLCanvasElement,
  opts: RenderOptions,
): Promise<RenderColorMeta> {
  const ecc = opts.logo ? "H" : opts.ecc;
  const { fg, bg, adjusted } = prepareScanColors(opts.fgColor, opts.bgColor);
  const dark = normalizeHex(fg);
  const light = normalizeHex(bg);

  canvas.style.width = `${opts.size}px`;
  canvas.style.height = `${opts.size}px`;

  await QRCode.toCanvas(canvas, opts.payload, {
    errorCorrectionLevel: ecc,
    margin: opts.margin,
    width: opts.size,
    color: {
      dark,
      light,
    },
  });

  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";
  }

  if (opts.logo) {
    compositeLogo(canvas, opts.logo, light);
  }

  return { scanAdjusted: adjusted, fg: dark, bg: light };
}

export async function renderQrSvg(payload: string, opts: QrCustomize, logo?: HTMLImageElement | null): Promise<string> {
  const ecc: EccLevel = logo ? "H" : opts.ecc;
  const { fg, bg } = prepareScanColors(opts.fgColor, opts.bgColor);
  return QRCode.toString(payload, {
    type: "svg",
    errorCorrectionLevel: ecc,
    margin: opts.margin,
    width: opts.size,
    color: {
      dark: normalizeHex(fg),
      light: normalizeHex(bg),
    },
  });
}

export function compositeLogo(canvas: HTMLCanvasElement, logo: HTMLImageElement, quietColor: string): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const scaleFactor = w / (canvas.clientWidth || w);
  const maxLogo = Math.floor(w * 0.2);
  const scale = Math.min(maxLogo / logo.naturalWidth, maxLogo / logo.naturalHeight, 1);
  const lw = Math.floor(logo.naturalWidth * scale);
  const lh = Math.floor(logo.naturalHeight * scale);
  const pad = Math.floor(Math.max(lw, lh) * 0.14);
  const cx = (w - lw) / 2;
  const cy = (w - lh) / 2;
  const rx = cx - pad;
  const ry = cy - pad;
  const rw = lw + pad * 2;
  const rh = lh + pad * 2;

  ctx.fillStyle = quietColor;
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(rx, ry, rw, rh, Math.max(4, Math.floor(6 * scaleFactor)));
    ctx.fill();
  } else {
    ctx.fillRect(rx, ry, rw, rh);
  }
  ctx.drawImage(logo, cx, cy, lw, lh);
}

export async function renderShopSignPng(
  payload: string,
  payeeName: string,
  opts: QrCustomize,
): Promise<Blob> {
  const qrSize = Math.min(opts.size, 512);
  const pad = 48;
  const titleH = 56;
  const footerH = 44;
  const { bg } = prepareScanColors(opts.fgColor, opts.bgColor);
  const light = normalizeHex(bg);
  const W = qrSize + pad * 2;
  const H = titleH + qrSize + footerH + pad * 2;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#111111";
  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(payeeName.trim() || "Pay here", W / 2, pad + titleH / 2);
  const qrCanvas = document.createElement("canvas");
  await renderQrToCanvas(qrCanvas, { ...opts, payload, size: qrSize });
  ctx.drawImage(qrCanvas, pad, pad + titleH, qrSize, qrSize);
  ctx.font = "16px system-ui, sans-serif";
  ctx.fillStyle = "#444444";
  ctx.fillText("Scan to pay with any UPI app", W / 2, pad + titleH + qrSize + footerH / 2);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not create image."))), "image/png");
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadText(text: string, filename: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  downloadBlob(blob, filename);
}

export async function copyCanvasToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  try {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob || typeof ClipboardItem === "undefined") return false;
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}