"use client";

import { usePdfStore } from "@/lib/pdf-studio/store";

export default function StatusBar() {
  const session = usePdfStore((s) => s.session);
  const setZoom = usePdfStore((s) => s.setZoom);
  if (!session) return null;
  const pageIndex = session.currentPageId ? session.pageOrder.indexOf(session.currentPageId) + 1 : 0;
  const bytes = Object.values(session.sources).reduce((n, s) => n + s.byteLength, 0);

  return (
    <footer className="ps-status">
      <span>
        Page {pageIndex || "—"} / {session.pageOrder.length}
      </span>
      <span>
        <button type="button" className="ps-btn ps-btn--icon" onClick={() => setZoom(session.zoom / 1.15)} aria-label="Zoom out">
          −
        </button>{" "}
        {Math.round(session.zoom * 100)}%{" "}
        <button type="button" className="ps-btn ps-btn--icon" onClick={() => setZoom(session.zoom * 1.15)} aria-label="Zoom in">
          +
        </button>
      </span>
      <button type="button" className="ps-btn" onClick={() => usePdfStore.setState((st) => st.session ? { session: { ...st.session, zoom: 1, fitMode: "width" } } : st)}>
        Fit width
      </button>
      <span>{(bytes / 1024).toFixed(0)} KB</span>
      <span>{session.dirty ? "Unsaved changes" : "Saved export ready"}</span>
      {session.processing && <span aria-live="polite">{session.processing}</span>}
      {session.error && (
        <span className="ps-err" role="alert">
          {session.error}
        </span>
      )}
    </footer>
  );
}