"use client";

import { useEffect, useMemo, useRef } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { usePdfStore } from "@/lib/pdf-studio/store";
import AppBar from "./AppBar";
import EditorToolbar from "./EditorToolbar";
import PageSidebar from "./PageSidebar";
import PageView from "./PageView";
import PropertiesPanel from "./PropertiesPanel";
import StatusBar from "./StatusBar";

export default function Workspace() {
  const session = usePdfStore((s) => s.session);
  const ui = usePdfStore((s) => s.ui);
  const undo = usePdfStore((s) => s.undo);
  const redo = usePdfStore((s) => s.redo);
  const deleteSelectedObjects = usePdfStore((s) => s.deleteSelectedObjects);
  const selectObjects = usePdfStore((s) => s.selectObjects);
  const toggleUi = usePdfStore((s) => s.toggleUi);
  const docCache = useRef(new Map<string, PDFDocumentProxy>());

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      const typing = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        if (!typing) {
          e.preventDefault();
          undo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        if (!typing) {
          e.preventDefault();
          redo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        document.querySelector<HTMLButtonElement>(".ps-btn--primary")?.click();
      }
      if (e.key === "Escape") selectObjects([]);
      if ((e.key === "Delete" || e.key === "Backspace") && !typing) {
        e.preventDefault();
        deleteSelectedObjects();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, deleteSelectedObjects, selectObjects]);

  const scale = useMemo(() => {
    if (!session) return 1;
    if (session.fitMode === "custom") return session.zoom;
    // Approximate fit-width for ~900px canvas area
    const first = session.pages[session.pageOrder[0]];
    if (!first) return session.zoom;
    const target = typeof window !== "undefined" ? Math.min(900, window.innerWidth - 120) : 800;
    return Math.min(2, Math.max(0.4, (target * session.zoom) / first.width));
  }, [session]);

  if (!session) return null;

  const bodyClass = [
    "ps-body",
    !ui.leftOpen && ui.rightOpen ? "ps-left-collapsed" : "",
    ui.leftOpen && !ui.rightOpen ? "ps-right-collapsed" : "",
    !ui.leftOpen && !ui.rightOpen ? "ps-both-collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="ps-workspace" role="application" aria-label="PDF Studio editor">
      <AppBar />
      <EditorToolbar />
      <div className={bodyClass}>
        <PageSidebar open={ui.leftOpen} />
        <div className="ps-canvas-wrap">
          <div className="ps-pages">
            {(session.viewMode === "single"
              ? session.currentPageId
                ? [session.currentPageId]
                : session.pageOrder.slice(0, 1)
              : session.pageOrder
            ).map((id) => {
              const page = session.pages[id];
              if (!page) return null;
              return <PageView key={id} page={page} scale={scale} docCache={docCache.current} />;
            })}
          </div>
        </div>
        <PropertiesPanel open={ui.rightOpen} />
      </div>
      <div className="ps-mobile-bar">
        <button type="button" className="ps-btn" onClick={() => toggleUi("leftOpen")}>
          Pages
        </button>
        <button type="button" className="ps-btn" onClick={() => toggleUi("rightOpen")}>
          Tools
        </button>
      </div>
      <StatusBar />
    </div>
  );
}