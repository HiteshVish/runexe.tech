"use client";

import Link from "next/link";
import { useRef } from "react";
import { exportSession } from "@/lib/pdf-studio/engines/export";
import { usePdfStore } from "@/lib/pdf-studio/store";
import { readFileBytes } from "@/lib/pdf-studio/validate";

function downloadBytes(bytes: Uint8Array, name: string) {
  const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name.endsWith(".pdf") ? name : `${name}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function AppBar() {
  const session = usePdfStore((s) => s.session);
  const undo = usePdfStore((s) => s.undo);
  const redo = usePdfStore((s) => s.redo);
  const setName = usePdfStore((s) => s.setName);
  const closeSession = usePdfStore((s) => s.closeSession);
  const openFromBytes = usePdfStore((s) => s.openFromBytes);
  const openMultiple = usePdfStore((s) => s.openMultiple);
  const openBlank = usePdfStore((s) => s.openBlank);
  const setProcessing = usePdfStore((s) => s.setProcessing);
  const markClean = usePdfStore((s) => s.markClean);
  const toggleUi = usePdfStore((s) => s.toggleUi);
  const setError = usePdfStore((s) => s.setError);
  const fileRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLInputElement>(null);

  if (!session) return null;

  async function onDownload() {
    if (!session) return;
    setProcessing("Exporting PDF…");
    try {
      const bytes = await exportSession(session);
      downloadBytes(bytes, session.name);
      markClean();
    } catch {
      setError("Export failed. Try again or simplify the document.");
    } finally {
      setProcessing(null);
    }
  }

  function confirmClose() {
    if (session?.dirty && !window.confirm("You have unsaved changes. Close anyway?")) return;
    closeSession();
  }

  return (
    <header className="ps-appbar">
      <Link href="/tools" className="ps-btn">
        Tools
      </Link>
      <button type="button" className="ps-btn" onClick={() => fileRef.current?.click()}>
        Open
      </button>
      <button type="button" className="ps-btn" onClick={() => addRef.current?.click()}>
        Add files
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          if (session.dirty && !window.confirm("Replace the current document? Unsaved changes will be lost.")) return;
          await openFromBytes(await readFileBytes(f), f.name);
        }}
      />
      <input
        ref={addRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        hidden
        onChange={async (e) => {
          const files = e.target.files;
          e.target.value = "";
          if (!files?.length) return;
          const list = [];
          for (const f of Array.from(files)) {
            list.push({ bytes: await readFileBytes(f), name: f.name });
          }
          // Append by reopening as multi with existing pages — merge into current via openMultiple of current+new is heavy;
          // simpler: openMultiple of new files in merge mode when session empty; else use store openMultiple after combining sources
          await openMultiple(
            [
              ...Object.values(session.sources).map((s) => ({ bytes: s.bytes, name: s.name })),
              ...list,
            ],
            session.mode,
          );
        }}
      />
      <input
        type="text"
        value={session.name}
        aria-label="Document name"
        onChange={(e) => setName(e.target.value)}
      />
      <button type="button" className="ps-btn" onClick={() => void openBlank("A4")}>
        New
      </button>
      <button type="button" className="ps-btn" onClick={undo}>
        Undo
      </button>
      <button type="button" className="ps-btn" onClick={redo}>
        Redo
      </button>
      <button type="button" className="ps-btn" onClick={() => toggleUi("leftOpen")}>
        Pages
      </button>
      <button type="button" className="ps-btn" onClick={() => toggleUi("rightOpen")}>
        Properties
      </button>
      <button type="button" className="ps-btn" onClick={() => toggleUi("fullscreen")}>
        Fullscreen
      </button>
      <button type="button" className="ps-btn ps-btn--primary" onClick={() => void onDownload()}>
        Download PDF
      </button>
      <button type="button" className="ps-btn" onClick={confirmClose}>
        Close
      </button>
    </header>
  );
}