import { PDFDocument, StandardFonts, rgb, degrees, type PDFPage, type PDFFont } from "pdf-lib";
import { topLeftToPdfLib } from "../coords";
import type {
  DocumentSession,
  EditObject,
  ImageObject,
  PageModel,
  PenObject,
  ShapeObject,
  TextObject,
  WatermarkObject,
} from "../types";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

async function embedStandardFont(doc: PDFDocument, family: string): Promise<PDFFont> {
  const map: Record<string, StandardFonts> = {
    Helvetica: StandardFonts.Helvetica,
    "Helvetica-Bold": StandardFonts.HelveticaBold,
    "Times-Roman": StandardFonts.TimesRoman,
    "Times-Bold": StandardFonts.TimesRomanBold,
    Courier: StandardFonts.Courier,
    "Courier-Bold": StandardFonts.CourierBold,
  };
  return doc.embedFont(map[family] ?? StandardFonts.Helvetica);
}

async function drawObject(page: PDFPage, obj: EditObject, pageModel: PageModel, fonts: Map<string, PDFFont>, pdfDoc: PDFDocument) {
  const ph = pageModel.height;
  const op = obj.opacity ?? 1;

  if (obj.type === "text") {
    const t = obj as TextObject;
    const font = fonts.get(t.bold ? `${t.fontFamily}-Bold` : t.fontFamily) ?? fonts.get("Helvetica")!;
    const { x, y } = topLeftToPdfLib(t.x, t.y, t.width, t.height, ph);
    const c = hexToRgb(t.color);
    const lines = t.text.split("\n");
    const lineH = t.fontSize * (t.lineHeight || 1.25);
    lines.forEach((line, i) => {
      page.drawText(line, {
        x,
        y: y + t.height - (i + 1) * lineH,
        size: t.fontSize,
        font,
        color: rgb(c.r, c.g, c.b),
        opacity: op,
        rotate: degrees(t.rotation || 0),
        maxWidth: t.width,
      });
    });
    return;
  }

  if (obj.type === "image" || obj.type === "signature") {
    const im = obj as ImageObject;
    const { x, y, width, height } = topLeftToPdfLib(im.x, im.y, im.width, im.height, ph);
    const res = await fetch(im.src);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
    const embedded = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
    page.drawImage(embedded, {
      x,
      y,
      width,
      height,
      opacity: op,
      rotate: degrees(im.rotation || 0),
    });
    return;
  }

  if (obj.type === "pen") {
    const p = obj as PenObject;
    const c = hexToRgb(p.stroke);
    const pts = p.points;
    for (let i = 0; i + 3 < pts.length; i += 2) {
      const x1 = pts[i];
      const y1 = ph - pts[i + 1];
      const x2 = pts[i + 2];
      const y2 = ph - pts[i + 3];
      page.drawLine({
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        thickness: p.strokeWidth,
        color: rgb(c.r, c.g, c.b),
        opacity: op,
      });
    }
    return;
  }

  if (obj.type === "watermark") {
    const w = obj as WatermarkObject;
    const font = fonts.get("Helvetica-Bold") ?? fonts.get("Helvetica")!;
    const c = hexToRgb(w.color);
    const { x, y } = topLeftToPdfLib(w.x, w.y, w.width, w.height, ph);
    page.drawText(w.text, {
      x,
      y,
      size: w.fontSize,
      font,
      color: rgb(c.r, c.g, c.b),
      opacity: op,
      rotate: degrees(w.rotation || -30),
    });
    return;
  }

  const s = obj as ShapeObject;
  const { x, y, width, height } = topLeftToPdfLib(s.x, s.y, s.width, s.height, ph);
  const fill = hexToRgb(s.fill || "#000000");
  const stroke = hexToRgb(s.stroke || "#000000");

  if (s.type === "whiteout" || s.type === "highlight" || s.type === "rect") {
    page.drawRectangle({
      x,
      y,
      width,
      height,
      color: rgb(fill.r, fill.g, fill.b),
      opacity: s.type === "highlight" ? Math.min(op, 0.45) : op,
      borderColor: s.type === "rect" ? rgb(stroke.r, stroke.g, stroke.b) : undefined,
      borderWidth: s.type === "rect" ? s.strokeWidth : 0,
      rotate: degrees(s.rotation || 0),
    });
  } else if (s.type === "ellipse") {
    page.drawEllipse({
      x: x + width / 2,
      y: y + height / 2,
      xScale: width / 2,
      yScale: height / 2,
      color: rgb(fill.r, fill.g, fill.b),
      borderColor: rgb(stroke.r, stroke.g, stroke.b),
      borderWidth: s.strokeWidth,
      opacity: op,
    });
  } else if (s.type === "line" || s.type === "arrow" || s.type === "underline" || s.type === "strikethrough") {
    page.drawLine({
      start: { x, y: y + height / 2 },
      end: { x: x + width, y: y + height / 2 },
      thickness: s.strokeWidth || 2,
      color: rgb(stroke.r, stroke.g, stroke.b),
      opacity: op,
    });
  } else if (s.type === "check" || s.type === "cross") {
    const color = rgb(stroke.r, stroke.g, stroke.b);
    if (s.type === "check") {
      page.drawLine({ start: { x: x + width * 0.15, y: y + height * 0.45 }, end: { x: x + width * 0.4, y: y + height * 0.2 }, thickness: 2, color, opacity: op });
      page.drawLine({ start: { x: x + width * 0.4, y: y + height * 0.2 }, end: { x: x + width * 0.85, y: y + height * 0.75 }, thickness: 2, color, opacity: op });
    } else {
      page.drawLine({ start: { x, y }, end: { x: x + width, y: y + height }, thickness: 2, color, opacity: op });
      page.drawLine({ start: { x: x + width, y }, end: { x, y: y + height }, thickness: 2, color, opacity: op });
    }
  }
}

function pageNumberText(format: string, n: number, total: number, prefix: string, suffix: string): string {
  let core = `${n}`;
  if (format === "page-n") core = `Page ${n}`;
  if (format === "page-n-of-m") core = `Page ${n} of ${total}`;
  return `${prefix}${core}${suffix}`;
}

/**
 * Build final PDF from session: copy pages in order from source docs, draw overlays.
 */
export async function exportSession(session: DocumentSession): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  const fonts = new Map<string, PDFFont>();
  for (const name of ["Helvetica", "Helvetica-Bold", "Times-Roman", "Times-Bold", "Courier", "Courier-Bold"]) {
    fonts.set(name, await embedStandardFont(out, name));
  }

  const sourceCache = new Map<string, PDFDocument>();
  async function getSource(id: string) {
    let d = sourceCache.get(id);
    if (!d) {
      const src = session.sources[id];
      if (!src) throw new Error("Missing source document.");
      d = await PDFDocument.load(src.bytes, { ignoreEncryption: false });
      sourceCache.set(id, d);
    }
    return d;
  }

  const total = session.pageOrder.length;
  for (let i = 0; i < session.pageOrder.length; i++) {
    const pageId = session.pageOrder[i];
    const pm = session.pages[pageId];
    if (!pm) continue;

    let page: PDFPage;
    if (pm.blank) {
      page = out.addPage([pm.width, pm.height]);
    } else {
      const src = await getSource(pm.sourceDocId);
      const [copied] = await out.copyPages(src, [pm.sourcePageIndex]);
      page = out.addPage(copied);
      if (pm.rotation) page.setRotation(degrees(pm.rotation));
      const margin = pm.cropMargin ?? 0;
      if (margin > 0) {
        const { width: mw, height: mh } = page.getSize();
        const w = Math.max(36, mw - margin * 2);
        const h = Math.max(36, mh - margin * 2);
        page.setCropBox(margin, margin, w, h);
      }
    }

    const objs = Object.values(session.objects)
      .filter((o) => o.pageId === pageId || (o.type === "watermark" && (o as WatermarkObject).applyToAll))
      .sort((a, b) => a.zIndex - b.zIndex);

    for (const obj of objs) {
      try {
        await drawObject(page, obj, pm, fonts, out);
      } catch {
        // Skip broken image embeds without aborting whole export
      }
    }

    if (session.pageNumbers.enabled) {
      const pn = session.pageNumbers;
      const n = pn.start + i;
      const text = pageNumberText(pn.format, n, total, pn.prefix, pn.suffix);
      const font = fonts.get("Helvetica")!;
      const { width: tw } = { width: font.widthOfTextAtSize(text, pn.fontSize) };
      const c = hexToRgb(pn.color);
      let x = (pm.width - tw) / 2;
      let y = pn.margin;
      if (pn.position === "bottom-left") x = pn.margin;
      if (pn.position === "bottom-right") x = pm.width - tw - pn.margin;
      if (pn.position === "top-center") y = pm.height - pn.margin - pn.fontSize;
      page.drawText(text, { x, y, size: pn.fontSize, font, color: rgb(c.r, c.g, c.b) });
    }
  }

  // Form values
  try {
    const form = out.getForm();
    for (const fv of session.formValues) {
      try {
        const field = form.getFieldMaybe(fv.name);
        if (!field) continue;
        const t = field.constructor.name;
        if (t.includes("Text") && typeof fv.value === "string") {
          form.getTextField(fv.name).setText(fv.value);
        } else if (t.includes("CheckBox") && typeof fv.value === "boolean") {
          const cb = form.getCheckBox(fv.name);
          if (fv.value) cb.check();
          else cb.uncheck();
        } else if (t.includes("Dropdown") && typeof fv.value === "string") {
          form.getDropdown(fv.name).select(fv.value);
        } else if (t.includes("Radio") && typeof fv.value === "string") {
          form.getRadioGroup(fv.name).select(fv.value);
        }
      } catch {
        /* unsupported field */
      }
    }
  } catch {
    /* no form */
  }

  return out.save({ useObjectStreams: true });
}

export async function mergePdfBytes(files: { bytes: Uint8Array; pageIndices?: number[] }[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const f of files) {
    const src = await PDFDocument.load(f.bytes);
    const indices = f.pageIndices ?? src.getPageIndices();
    const copied = await out.copyPages(src, indices);
    copied.forEach((p) => out.addPage(p));
  }
  return out.save();
}

export async function extractPages(bytes: Uint8Array, indices: number[]): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes);
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, indices);
  copied.forEach((p) => out.addPage(p));
  return out.save();
}

export async function createBlankPdf(
  width: number,
  height: number,
  pageCount = 1,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) doc.addPage([width, height]);
  return doc.save();
}

export async function imagesToPdf(
  images: { bytes: Uint8Array; mime: string }[],
  pageWidth: number,
  pageHeight: number,
  margin: number,
  fit: "contain" | "cover",
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (const img of images) {
    const page = doc.addPage([pageWidth, pageHeight]);
    const embedded =
      img.mime.includes("png") || img.bytes[0] === 0x89
        ? await doc.embedPng(img.bytes)
        : await doc.embedJpg(img.bytes);
    const maxW = pageWidth - margin * 2;
    const maxH = pageHeight - margin * 2;
    const iw = embedded.width;
    const ih = embedded.height;
    const scale =
      fit === "cover"
        ? Math.max(maxW / iw, maxH / ih)
        : Math.min(maxW / iw, maxH / ih);
    const w = iw * scale;
    const h = ih * scale;
    page.drawImage(embedded, {
      x: (pageWidth - w) / 2,
      y: (pageHeight - h) / 2,
      width: w,
      height: h,
    });
  }
  return doc.save();
}