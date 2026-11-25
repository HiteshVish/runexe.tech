"use client";

import { useRef, useState } from "react";
import JSZip from "jszip";
import { extractPages } from "@/lib/pdf-studio/engines/export";
import { compressPdf, type CompressPreset } from "@/lib/pdf-studio/operations/compress";
import { parsePageRanges, splitEveryN, splitEveryPage } from "@/lib/pdf-studio/page-ranges";
import { usePdfStore } from "@/lib/pdf-studio/store";
import { newId, type WatermarkObject } from "@/lib/pdf-studio/types";
import { loadPdfDocument, renderPageToCanvas } from "@/lib/pdf-studio/engines/pdfjs-loader";
import { isAvailable } from "@/lib/pdf-studio/capability-registry";

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function ModePanels() {
  const session = usePdfStore((s) => s.session);
  const addObject = usePdfStore((s) => s.addObject);
  const setProcessing = usePdfStore((s) => s.setProcessing);
  const setError = usePdfStore((s) => s.setError);
  const setTool = usePdfStore((s) => s.setTool);
  const [ranges, setRanges] = useState("1-1");
  const [everyN, setEveryN] = useState(2);
  const [wmText, setWmText] = useState("CONFIDENTIAL");
  const [compressPreset, setCompressPreset] = useState<CompressPreset>("balanced");
  const [targetKb, setTargetKb] = useState(500);
  const [compressInfo, setCompressInfo] = useState<string | null>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  if (!session) return null;
  const doc = session;
  const mode = doc.mode;
  const primarySource = Object.values(doc.sources)[0];

  async function splitDownload(groups: number[][]) {
    if (!primarySource) return;
    setProcessing("Splitting…");
    try {
      if (groups.length === 1) {
        const bytes = await extractPages(primarySource.bytes, groups[0]);
        downloadBlob(new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], { type: "application/pdf" }), "split.pdf");
      } else {
        const zip = new JSZip();
        for (let i = 0; i < groups.length; i++) {
          const bytes = await extractPages(primarySource.bytes, groups[i]);
          zip.file(`part-${i + 1}.pdf`, bytes);
        }
        const out = await zip.generateAsync({ type: "blob" });
        downloadBlob(out, "split-pages.zip");
      }
    } catch {
      setError("Split failed.");
    } finally {
      setProcessing(null);
    }
  }

  function addWatermark() {
    const pageId = doc.currentPageId ?? doc.pageOrder[0];
    if (!pageId) return;
    const page = doc.pages[pageId];
    addObject({
      id: newId("obj"),
      pageId,
      type: "watermark",
      x: page.width * 0.15,
      y: page.height * 0.4,
      width: page.width * 0.7,
      height: 48,
      rotation: -30,
      opacity: 0.25,
      zIndex: 999,
      text: wmText,
      fontSize: 36,
      color: "#888888",
      applyToAll: true,
    } as WatermarkObject);
  }

  function placeSignatureFromCanvas() {
    const canvas = sigCanvasRef.current;
    const pageId = doc.currentPageId ?? doc.pageOrder[0];
    if (!canvas || !pageId) return;
    const src = canvas.toDataURL("image/png");
    addObject({
      id: newId("obj"),
      pageId,
      type: "signature",
      x: 72,
      y: doc.pages[pageId].height - 160,
      width: 180,
      height: 60,
      rotation: 0,
      opacity: 1,
      zIndex: Object.keys(doc.objects).length + 1,
      src,
      lockAspect: true,
    });
    setTool("select");
  }

  async function runCompress() {
    if (!primarySource) return;
    if (!isAvailable("compress")) return;
    setProcessing("Compressing…");
    setCompressInfo(null);
    try {
      const result = await compressPdf(
        primarySource.bytes,
        compressPreset,
        compressPreset === "target" ? targetKb * 1024 : undefined,
        (p) => setProcessing(`Compressing… ${Math.round(p * 100)}%`),
      );
      downloadBlob(
        new Blob([result.bytes.buffer.slice(result.bytes.byteOffset, result.bytes.byteOffset + result.bytes.byteLength) as ArrayBuffer], {
          type: "application/pdf",
        }),
        "compressed.pdf",
      );
      setCompressInfo(
        `Original ${(result.originalSize / 1024).toFixed(0)} KB → ${(result.outputSize / 1024).toFixed(0)} KB (${result.reductionPct.toFixed(0)}% smaller). ${result.note}`,
      );
    } catch {
      setError("Compression failed on this document.");
    } finally {
      setProcessing(null);
    }
  }

  async function pdfToImages() {
    if (!primarySource) return;
    setProcessing("Rendering pages…");
    try {
      const doc = await loadPdfDocument(primarySource.bytes);
      const zip = new JSZip();
      for (let i = 0; i < doc.numPages; i++) {
        const canvas = document.createElement("canvas");
        await renderPageToCanvas(doc, i, 1.5, canvas);
        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.9));
        if (blob) zip.file(`page-${i + 1}.jpg`, blob);
      }
      downloadBlob(await zip.generateAsync({ type: "blob" }), "pdf-pages.zip");
    } catch {
      setError("PDF to image failed.");
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="ps-panel-tools">
      {(mode === "split" || mode === "remove-pages") && (
        <>
          <h3>Split / extract</h3>
          <label>Page ranges</label>
          <input value={ranges} onChange={(e) => setRanges(e.target.value)} placeholder="1-3, 5, 8-10" />
          <button
            type="button"
            className="ps-btn ps-btn--primary"
            style={{ marginTop: 8 }}
            onClick={() => {
              const count = primarySource?.pageCount ?? session.pageOrder.length;
              const parsed = parsePageRanges(ranges, count);
              if (!parsed.ok) {
                setError(parsed.error);
                return;
              }
              void splitDownload([parsed.indices]);
            }}
          >
            Extract ranges
          </button>
          <button type="button" className="ps-btn" style={{ marginTop: 6 }} onClick={() => void splitDownload(splitEveryPage(primarySource?.pageCount ?? 0))}>
            Split every page (ZIP)
          </button>
          <label>Every N pages</label>
          <input type="number" min={1} value={everyN} onChange={(e) => setEveryN(Number(e.target.value) || 1)} />
          <button type="button" className="ps-btn" onClick={() => void splitDownload(splitEveryN(primarySource?.pageCount ?? 0, everyN))}>
            Split every N (ZIP)
          </button>
        </>
      )}

      {(mode === "sign" || mode === "editor") && (
        <>
          <h3>Electronic signature</h3>
          <p style={{ fontSize: "0.75rem", color: "var(--ps-muted)" }}>Drawn signature — not a certificate-based digital signature.</p>
          <canvas
            ref={sigCanvasRef}
            className="ps-sig-pad"
            width={280}
            height={140}
            onPointerDown={(e) => {
              drawing.current = true;
              const ctx = sigCanvasRef.current?.getContext("2d");
              if (!ctx) return;
              const r = sigCanvasRef.current!.getBoundingClientRect();
              ctx.strokeStyle = "#111";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
            }}
            onPointerMove={(e) => {
              if (!drawing.current) return;
              const ctx = sigCanvasRef.current?.getContext("2d");
              if (!ctx) return;
              const r = sigCanvasRef.current!.getBoundingClientRect();
              ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
              ctx.stroke();
            }}
            onPointerUp={() => {
              drawing.current = false;
            }}
          />
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button
              type="button"
              className="ps-btn"
              onClick={() => {
                const c = sigCanvasRef.current;
                const ctx = c?.getContext("2d");
                if (c && ctx) ctx.clearRect(0, 0, c.width, c.height);
              }}
            >
              Clear
            </button>
            <button type="button" className="ps-btn ps-btn--primary" onClick={placeSignatureFromCanvas}>
              Place signature
            </button>
          </div>
          <button
            type="button"
            className="ps-btn"
            style={{ marginTop: 6 }}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/png,image/jpeg,image/webp";
              input.onchange = () => {
                const f = input.files?.[0];
                const pageId = session.currentPageId ?? session.pageOrder[0];
                if (!f || !pageId) return;
                const src = URL.createObjectURL(f);
                addObject({
                  id: newId("obj"),
                  pageId,
                  type: "signature",
                  x: 72,
                  y: 72,
                  width: 180,
                  height: 60,
                  rotation: 0,
                  opacity: 1,
                  zIndex: 50,
                  src,
                  lockAspect: true,
                });
              };
              input.click();
            }}
          >
            Upload signature image
          </button>
        </>
      )}

      {(mode === "watermark" || mode === "editor") && (
        <>
          <h3>Watermark</h3>
          <input value={wmText} onChange={(e) => setWmText(e.target.value)} />
          <button type="button" className="ps-btn ps-btn--primary" style={{ marginTop: 6 }} onClick={addWatermark}>
            Apply watermark
          </button>
        </>
      )}

      {mode === "compress" && (
        <>
          <h3>Compress</h3>
          <select value={compressPreset} onChange={(e) => setCompressPreset(e.target.value as CompressPreset)}>
            <option value="lossless">Lossless optimize</option>
            <option value="high">High quality (raster)</option>
            <option value="balanced">Balanced (raster)</option>
            <option value="maximum">Maximum (raster)</option>
            <option value="target">Target size (raster)</option>
          </select>
          {compressPreset === "target" && (
            <>
              <label>Target KB</label>
              <select value={targetKb} onChange={(e) => setTargetKb(Number(e.target.value))}>
                {[50, 100, 200, 500, 1024, 2048].map((n) => (
                  <option key={n} value={n}>
                    {n >= 1024 ? `${n / 1024} MB` : `${n} KB`}
                  </option>
                ))}
              </select>
            </>
          )}
          <button type="button" className="ps-btn ps-btn--primary" style={{ marginTop: 8 }} onClick={() => void runCompress()}>
            Compress & download
          </button>
          {compressInfo && <p style={{ fontSize: "0.75rem", marginTop: 8 }}>{compressInfo}</p>}
        </>
      )}

      {mode === "pdf-to-image" && (
        <>
          <h3>PDF to images</h3>
          <button type="button" className="ps-btn ps-btn--primary" onClick={() => void pdfToImages()}>
            Download JPG ZIP
          </button>
        </>
      )}

      {(mode === "merge" || mode === "organize" || mode === "rotate") && (
        <p style={{ fontSize: "0.8rem", color: "var(--ps-muted)" }}>
          Use the page sidebar to reorder, rotate, duplicate or delete pages, then Download PDF.
        </p>
      )}

      {mode === "add-text" && (
        <button type="button" className="ps-btn ps-btn--primary" onClick={() => setTool("text")}>
          Click a page to add text
        </button>
      )}

      {mode === "crop" && <CropControls />}

      {mode === "editor" && <FormsPanel />}

      {mode === "metadata" && primarySource && (
        <MetadataEditor />
      )}
    </div>
  );
}

function CropControls() {
  const session = usePdfStore((s) => s.session);
  const commit = usePdfStore((s) => s.commit);
  const [margin, setMargin] = useState(36);
  if (!session) return null;
  return (
    <>
      <h3>Crop</h3>
      <p style={{ fontSize: "0.75rem", color: "var(--ps-muted)" }}>
        Shrinks page boxes by a margin. This does not securely erase hidden content outside the crop.
      </p>
      <label>Margin (pt)</label>
      <input type="number" min={0} value={margin} onChange={(e) => setMargin(Number(e.target.value) || 0)} />
      <button
        type="button"
        className="ps-btn ps-btn--primary"
        style={{ marginTop: 8 }}
        onClick={() =>
          commit("crop pages", (s) => {
            const ids = s.selectedPageIds.length ? s.selectedPageIds : s.pageOrder;
            const pages = { ...s.pages };
            for (const id of ids) {
              const p = pages[id];
              if (!p) continue;
              pages[id] = {
                ...p,
                width: Math.max(72, p.width - margin * 2),
                height: Math.max(72, p.height - margin * 2),
              };
            }
            return { ...s, pages };
          })
        }
      >
        Apply crop to selected
      </button>
    </>
  );
}

function FormsPanel() {
  const session = usePdfStore((s) => s.session);
  const commit = usePdfStore((s) => s.commit);
  const [fields, setFields] = useState<{ name: string; type: string }[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadFields() {
    if (!session) return;
    const primary = Object.values(session.sources)[0];
    if (!primary) return;
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(primary.bytes);
      try {
        const form = doc.getForm();
        const list = form.getFields().map((f) => ({ name: f.getName(), type: f.constructor.name }));
        setFields(list);
        if (!list.length) setMsg("No AcroForm fields found.");
        else setMsg(null);
      } catch {
        setMsg("This PDF has no fillable AcroForm, or uses unsupported XFA forms.");
        setFields([]);
      }
    } catch {
      setMsg("Could not read form fields.");
    }
  }

  if (!session) return null;
  return (
    <>
      <h3>Form fields</h3>
      <button type="button" className="ps-btn" onClick={() => void loadFields()}>
        Detect AcroForm fields
      </button>
      {msg && <p style={{ fontSize: "0.75rem", color: "var(--ps-muted)" }}>{msg}</p>}
      {fields.map((f) => {
        const existing = session.formValues.find((v) => v.name === f.name);
        return (
          <div key={f.name}>
            <label>
              {f.name} <small>({f.type})</small>
            </label>
            <input
              defaultValue={typeof existing?.value === "string" ? existing.value : ""}
              onBlur={(e) =>
                commit("form value", (s) => {
                  const rest = s.formValues.filter((v) => v.name !== f.name);
                  return { ...s, formValues: [...rest, { name: f.name, value: e.target.value }] };
                })
              }
            />
          </div>
        );
      })}
    </>
  );
}

function MetadataEditor() {
  const session = usePdfStore((s) => s.session);
  const setProcessing = usePdfStore((s) => s.setProcessing);
  const setError = usePdfStore((s) => s.setError);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [keywords, setKeywords] = useState("");

  async function applyMeta(strip = false) {
    if (!session) return;
    const primary = Object.values(session.sources)[0];
    if (!primary) return;
    setProcessing("Updating metadata…");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(primary.bytes);
      if (strip) {
        doc.setTitle("");
        doc.setAuthor("");
        doc.setSubject("");
        doc.setKeywords([]);
        doc.setProducer("");
        doc.setCreator("");
      } else {
        doc.setTitle(title);
        doc.setAuthor(author);
        doc.setSubject(subject);
        doc.setKeywords(keywords.split(",").map((s) => s.trim()).filter(Boolean));
      }
      const bytes = await doc.save();
      const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], {
        type: "application/pdf",
      });
      downloadBlob(blob, strip ? "metadata-stripped.pdf" : "metadata-updated.pdf");
    } catch {
      setError("Could not update metadata.");
    } finally {
      setProcessing(null);
    }
  }

  return (
    <>
      <h3>Metadata</h3>
      <p style={{ fontSize: "0.75rem", color: "var(--ps-muted)" }}>
        Edits Title, Author, Subject and Keywords. Strip removes those fields and Producer/Creator — not a full
        sanitization of hidden data.
      </p>
      <label>Title</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <label>Author</label>
      <input value={author} onChange={(e) => setAuthor(e.target.value)} />
      <label>Subject</label>
      <input value={subject} onChange={(e) => setSubject(e.target.value)} />
      <label>Keywords</label>
      <input value={keywords} onChange={(e) => setKeywords(e.target.value)} />
      <button type="button" className="ps-btn ps-btn--primary" style={{ marginTop: 8 }} onClick={() => void applyMeta(false)}>
        Save metadata PDF
      </button>
      <button type="button" className="ps-btn" style={{ marginTop: 6 }} onClick={() => void applyMeta(true)}>
        Strip metadata & download
      </button>
    </>
  );
}