"use client";

import { useEffect, useMemo, useRef } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { StudioMode } from "@/lib/pdf-studio/constants";
import { usePdfStore } from "@/lib/pdf-studio/store";
import { Ico } from "../icons";
import AppBar from "./AppBar";
import EditorToolbar from "./EditorToolbar";
import PageSidebar from "./PageSidebar";
import PageView from "./PageView";
import PropertiesPanel from "./PropertiesPanel";
import StatusBar from "./StatusBar";

const TASK_MODES: StudioMode[] = ["merge", "split", "compress", "pdf-to-image", "image-to-pdf", "crop", "metadata"];

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
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey && !typing) {
        e.preventDefault();
        undo();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey)) && !typing) {
        e.preventDefault();
        redo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        document.querySelector<HTMLButtonElement>("[data-ps-download]")?.click();
      }
      if (e.key === "Escape") {
        selectObjects([]);
        if (ui.leftOpen || ui.rightOpen) {
          usePdfStore.setState((st) => ({ ui: { ...st.ui, leftOpen: false, rightOpen: false } }));
        }
      }
      if ((e.key === "Delete" || e.key === "Backspace") && !typing) {
        e.preventDefault();
        deleteSelectedObjects();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, deleteSelectedObjects, selectObjects, ui.leftOpen, ui.rightOpen]);

  const scale = useMemo(() => {
    if (!session) return 1;
    if (session.fitMode === "custom") return session.zoom;
    const first = session.pages[session.pageOrder[0]];
    if (!first) return session.zoom;
    const target = typeof window !== "undefined" ? Math.min(900, window.innerWidth - (ui.leftOpen ? 88 : 0) - (ui.rightOpen ? 280 : 0) - 48) : 800;
    return Math.min(2, Math.max(0.4, (target * session.zoom) / first.width));
  }, [session, ui.leftOpen, ui.rightOpen]);

  if (!session) return null;

  const taskMode = TASK_MODES.includes(session.mode);
  const bodyClass = [
    "ps-body",
    !ui.leftOpen && ui.rightOpen ? "ps-left-collapsed" : "",
    ui.leftOpen && !ui.rightOpen ? "ps-right-collapsed" : "",
    !ui.leftOpen && !ui.rightOpen ? "ps-both-collapsed" : "",
    taskMode ? "ps-task-mode" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const drawerOpen = ui.leftOpen || ui.rightOpen;

  return (
    <div className={`ps-workspace${ui.fullscreen ? " ps-is-fullscreen" : ""}`} role="application" aria-label="PDF Studio editor">
      {session.tool === "whiteout" && (
        <div className="ps-notice" role="status">
          Whiteout covers content visually — it is not secure redaction. Hidden text may remain in the file.
        </div>
      )}
      <AppBar />
      <EditorToolbar />
      <div className={bodyClass}>
        <div
          className={`ps-drawer-backdrop${drawerOpen ? " is-on" : ""}`}
          onClick={() => usePdfStore.setState((st) => ({ ui: { ...st.ui, leftOpen: false, rightOpen: false } }))}
          aria-hidden
        />
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
        <button type="button" className="ps-btn ps-btn--icon" aria-label="Pages" onClick={() => toggleUi("leftOpen")}>
          {Ico.pages}
        </button>
        <button type="button" className="ps-btn ps-btn--icon" aria-label="Tools" onClick={() => toggleUi("rightOpen")}>
          {Ico.props}
        </button>
        <button type="button" className="ps-btn ps-btn--primary" data-ps-download onClick={() => document.querySelector<HTMLButtonElement>(".ps-appbar [data-ps-download]")?.click()}>
          {Ico.download} Download
        </button>
      </div>
      <StatusBar />
    </div>
  );
}