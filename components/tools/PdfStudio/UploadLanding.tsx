"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { PAGE_SIZES, type PageSizeName, type StudioMode } from "@/lib/pdf-studio/constants";
import { usePdfStore } from "@/lib/pdf-studio/store";
import { readFileBytes, validatePdfBytes } from "@/lib/pdf-studio/validate";
import { PDF_LANDING_SLUGS, pdfLandingMeta } from "@/lib/pdf-studio/landing-meta";
import { Ico } from "./icons";

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
    <div className="tool-page">
      <div className="ps-page">
        <nav aria-label="Breadcrumb" className="ps-breadcrumb">
          <Link href="/tools">Tools</Link>
          {" / "}
          <Link href="/tools/pdf-editor">PDF Studio</Link>
          {" / "}
          <span>{title}</span>
        </nav>

        <h1 className="ps-hero-title">{title}</h1>
        <p className="ps-hero-lead">{lead}</p>

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
          <div className="ps-drop-icon">{Ico.upload}</div>
          <h2>{mode === "image-to-pdf" ? "Drop images here" : "Drop PDF files here"}</h2>
          <p>Files stay on your device — nothing is uploaded to RunExe.</p>
          <button
            type="button"
            className="ps-btn ps-btn--primary"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            {mode === "image-to-pdf" ? "Select images" : "Select PDF files"}
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

        {(localError || sessionError) && (
          <p className="ps-err" role="alert">
            {localError || sessionError}
          </p>
        )}

        <p className="ps-privacy">Private by design: processing runs in your browser. Close the tab to discard the session.</p>

        <div className="ps-section">
          <span className="ps-section-label">Or start blank</span>
          <div className="ps-blank">
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
        </div>

        <section className="ps-related" aria-label="Related PDF tools">
          <span className="ps-section-label">Related tools</span>
          <div className="ps-chip-row">
            {PDF_LANDING_SLUGS.map((slug) => {
              const m = pdfLandingMeta(slug);
              return (
                <Link key={slug} href={m.path} className="ps-chip">
                  {m.h1}
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
