"use client";

import { useEffect, useRef, useState } from "react";
import { exportSession } from "@/lib/pdf-studio/engines/export";
import { usePdfStore } from "@/lib/pdf-studio/store";
import { readFileBytes } from "@/lib/pdf-studio/validate";
import { Ico } from "../icons";

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
  const ui = usePdfStore((s) => s.ui);
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
  const rootRef = useRef<HTMLElement>(null);
  const [menu, setMenu] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const sync = () => setDark(document.documentElement.getAttribute("data-theme") === "dark");
    sync();
    document.documentElement.addEventListener("themechange", sync);
    return () => document.documentElement.removeEventListener("themechange", sync);
  }, []);

  useEffect(() => {
    const el = rootRef.current?.closest(".ps-workspace") as HTMLElement | null;
    if (!el) return;
    if (ui.fullscreen) {
      el.classList.add("ps-is-fullscreen");
      void el.requestFullscreen?.().catch(() => {});
    } else {
      el.classList.remove("ps-is-fullscreen");
      if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {});
    }
  }, [ui.fullscreen]);

  function toggleTheme() {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      const sys = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      if (next === sys) localStorage.removeItem("runexe-theme");
      else localStorage.setItem("runexe-theme", next);
    } catch {
      /* ignore */
    }
    document.documentElement.dispatchEvent(new CustomEvent("themechange", { detail: next }));
    setDark(next === "dark");
  }

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
    <header className="ps-appbar" ref={rootRef as never}>
      <button type="button" className="ps-btn ps-btn--ghost ps-btn--icon" aria-label="Close document" title="Close document" onClick={confirmClose}>
        {Ico.back}
      </button>
      <input type="text" value={session.name} aria-label="Document name" onChange={(e) => setName(e.target.value)} />
      <button type="button" className="ps-btn ps-btn--ghost ps-btn--icon" onClick={undo} aria-label="Undo" title="Undo">
        {Ico.undo}
      </button>
      <button type="button" className="ps-btn ps-btn--ghost ps-btn--icon" onClick={redo} aria-label="Redo" title="Redo">
        {Ico.redo}
      </button>
      <div className="ps-appbar-spacer" />
      <button type="button" className="ps-btn ps-btn--ghost ps-btn--icon" onClick={() => toggleUi("leftOpen")} aria-label="Pages" title="Pages">
        {Ico.pages}
      </button>
      <button type="button" className="ps-btn ps-btn--ghost ps-btn--icon" onClick={() => toggleUi("rightOpen")} aria-label="Properties" title="Properties">
        {Ico.props}
      </button>
      <button
        type="button"
        className="ps-btn ps-btn--ghost ps-btn--icon"
        onClick={toggleTheme}
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        title={dark ? "Light mode" : "Dark mode"}
        aria-pressed={dark}
      >
        {dark ? Ico.sun : Ico.moon}
      </button>
      <button
        type="button"
        className="ps-btn ps-btn--ghost ps-btn--icon"
        onClick={() => toggleUi("fullscreen")}
        aria-label="Fullscreen"
        title="Fullscreen"
        aria-pressed={ui.fullscreen}
      >
        {Ico.fullscreen}
      </button>
      <button type="button" className="ps-btn ps-btn--primary" onClick={() => void onDownload()} data-ps-download>
        {Ico.download} Download
      </button>
      <div className="ps-overflow">
        <button type="button" className="ps-btn ps-btn--ghost ps-btn--icon" aria-label="More" onClick={() => setMenu((m) => !m)}>
          {Ico.more}
        </button>
        {menu && (
          <div className="ps-overflow-menu" role="menu">
            <button type="button" className="ps-btn ps-btn--ghost" onClick={() => { setMenu(false); fileRef.current?.click(); }}>
              Open file
            </button>
            <button type="button" className="ps-btn ps-btn--ghost" onClick={() => { setMenu(false); addRef.current?.click(); }}>
              Add files
            </button>
            <button type="button" className="ps-btn ps-btn--ghost" onClick={() => { setMenu(false); void openBlank("A4"); }}>
              New blank
            </button>
            <button type="button" className="ps-btn ps-btn--ghost" onClick={() => { setMenu(false); confirmClose(); }}>
              Close
            </button>
          </div>
        )}
      </div>
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
          for (const f of Array.from(files)) list.push({ bytes: await readFileBytes(f), name: f.name });
          await openMultiple(
            [...Object.values(session.sources).map((s) => ({ bytes: s.bytes, name: s.name })), ...list],
            session.mode,
          );
        }}
      />
    </header>
  );
}