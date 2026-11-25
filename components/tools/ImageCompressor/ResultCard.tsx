"use client";

import JSZip from "jszip";
import { buildOutputFilename } from "@/lib/image/compress";
import type { CompressorSettings, FileItemState } from "./types";

type Props = {
  items: FileItemState[];
  settings: CompressorSettings;
  activeId?: string | null;
};

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function ResultCard({ items, settings, activeId }: Props) {
  const done = items.filter((i) => i.status === "done" && i.result);

  if (!done.length) return null;

  const active = done.find((i) => i.id === activeId) ?? done[0];

  return (
    <div className="dt-toolbar" style={{ marginTop: 12 }}>
      <button
        type="button"
        className="dt-btn primary"
        onClick={() => {
          const r = active.result!;
          const blob = r.usedOriginal ? active.file : r.blob;
          const name = buildOutputFilename(active.file.name, settings.outputFormat);
          downloadBlob(blob, name);
        }}
      >
        Download selected
      </button>
      {done.length > 1 && (
        <button
          type="button"
          className="dt-btn"
          onClick={async () => {
            const zip = new JSZip();
            for (const item of done) {
              const r = item.result!;
              const blob = r.usedOriginal ? item.file : r.blob;
              const base = buildOutputFilename(item.file.name, settings.outputFormat);
              zip.file(base, blob);
            }
            const out = await zip.generateAsync({ type: "blob" });
            downloadBlob(out, "compressed-images.zip");
          }}
        >
          Download all as ZIP
        </button>
      )}
    </div>
  );
}