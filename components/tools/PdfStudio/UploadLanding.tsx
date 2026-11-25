"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import DevToolHeader from "@/components/tools/DevToolHeader";
import { PAGE_SIZES, type PageSizeName, type StudioMode } from "@/lib/pdf-studio/constants";
import { usePdfStore } from "@/lib/pdf-studio/store";
import { readFileBytes, validatePdfBytes } from "@/lib/pdf-studio/validate";
import { PDF_LANDING_SLUGS, pdfLandingMeta } from "@/lib/pdf-studio/landing-meta";

type Props = {
  title: string;
  lead: string;
  mode: StudioMode;
};

export default function UploadLanding({ title, lead, mode }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [blankSize, setBlankSize] = useState<PageSizeName>("A4");
  const [landscape, setLandscape] = useState(false);
  const openFromBytes = usePdfStore((s) => s.openFromBytes);
  const openMultiple = usePdfStore((s) => s.openMultiple);
  const openBlank = usePdfStore((s) => s.openBlank);
  const sessionError = usePdfStore((s) => s.session?.error);

  async function ingest(files: FileList | File[]) {
    setLocalError(null);
    const list = Array.from(files);
    if (!list.length) return;

    if (mode === "image-to-pdf") {
      setLocalError("Use the Image to PDF panel after opening the workspace, or drop images on that landing.");
      // Allow image→pdf path via store later; for landing, convert here
      const { imagesToPdf } = await import("@/lib/pdf-studio/engines/export");
      const images: { bytes: Uint8Array; mime: string }[] = [];
      for (const f of list) {
        if (!f.type.startsWith("image/")) {
          setLocalError("Only image files are accepted for Image to PDF.");
          return;
        }
        images.push({ bytes: await readFileBytes(f), mime: f.type });
      }
      const bytes = await imagesToPdf(images, PAGE_SIZES.A4.width, PAGE_SIZES.A4.height, 36, "contain");
      await openFromBytes(bytes, "images.pdf", "image-to-pdf");
      return;
    }

    const pdfs: { bytes: Uint8Array; name: string }[] = [];
    for (const f of list) {
      const bytes = await readFileBytes(f);
      const v = validatePdfBytes(bytes, f.name);
      if (!v.ok) {
        setLocalError(v.error);
        return;
      }
      pdfs.push({ bytes, name: f.name || "document.pdf" });
    }
    if (pdfs.length === 1) await openFromBytes(pdfs[0].bytes, pdfs[0].name, mode);
    else await openMultiple(pdfs, mode === "editor" ? "merge" : mode);
  }

  return (
    <div className="ps-page">
      <nav aria-label="Breadcrumb" className="dt-kicker" style={{ marginBottom: 8 }}>
        <Link href="/tools">Tools</Link>
        {" / "}
        <span>PDF Studio</span>
      </nav>
      <DevToolHeader title={title} lead={lead} badges={["Runs in your browser", "No upload", "No watermark"]} />

      <div
        className={`ps-drop${over ? " is-over" : ""}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void ingest(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <h2>Drop PDF files here</h2>
        <p>Select one or more PDFs. Files stay on your device — nothing is uploaded.</p>
        <button type="button" className="ps-btn ps-btn--primary" onClick={(e) => e.stopPropagation()}>
          Select PDF files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={mode === "image-to-pdf" ? "image/jpeg,image/png,image/webp" : "application/pdf,.pdf"}
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) void ingest(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {(localError || sessionError) && <p className="ps-err" role="alert">{localError || sessionError}</p>}

      <p className="ps-privacy">
        Privacy: RunExe PDF Studio processes documents in your browser. We do not auto-upload files, and we do not send
        document contents to analytics.
      </p>

      <div className="ps-blank">
        <span>Or start blank:</span>
        <select value={blankSize} onChange={(e) => setBlankSize(e.target.value as PageSizeName)} aria-label="Page size">
          {(Object.keys(PAGE_SIZES) as PageSizeName[]).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <label>
          <input type="checkbox" checked={landscape} onChange={(e) => setLandscape(e.target.checked)} /> Landscape
        </label>
        <button type="button" className="ps-btn" onClick={() => void openBlank(blankSize, landscape)}>
          New blank PDF
        </button>
      </div>

      <h2 className="dt-kicker" style={{ marginTop: 36 }}>
        PDF tools
      </h2>
      <div className="ps-features">
        {PDF_LANDING_SLUGS.map((slug) => {
          const m = pdfLandingMeta(slug);
          return (
            <Link key={slug} href={m.path} className="ps-feature">
              <strong>{m.h1}</strong>
              <span>{m.lead.slice(0, 80)}…</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}