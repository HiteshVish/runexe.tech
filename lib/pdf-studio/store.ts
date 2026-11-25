"use client";

import { create } from "zustand";
import type { StudioMode } from "./constants";
import { PAGE_SIZES } from "./constants";
import { emptyHistory, pushHistory, redoHistory, undoHistory, type HistoryState } from "./history";
import { createBlankPage, duplicatePage, reorderPages, rotatePage } from "./operations/pages";
import type {
  DocumentSession,
  EditObject,
  EditorTool,
  PageModel,
  SessionSnapshot,
  SourceDoc,
} from "./types";
import { defaultPageNumbers, newId } from "./types";
import { validatePdfBytes } from "./validate";
import { createBlankPdf } from "./engines/export";
import { loadPdfDocument } from "./engines/pdfjs-loader";

function snapshotFrom(s: DocumentSession): SessionSnapshot {
  return {
    name: s.name,
    pageOrder: [...s.pageOrder],
    pages: structuredClone(s.pages),
    objects: structuredClone(s.objects),
    formValues: structuredClone(s.formValues),
    pageNumbers: structuredClone(s.pageNumbers),
  };
}

function applySnapshot(s: DocumentSession, snap: SessionSnapshot): DocumentSession {
  return {
    ...s,
    name: snap.name,
    pageOrder: snap.pageOrder,
    pages: snap.pages,
    objects: snap.objects,
    formValues: snap.formValues,
    pageNumbers: snap.pageNumbers,
    dirty: true,
  };
}

function emptySession(mode: StudioMode = "editor"): DocumentSession {
  return {
    id: newId("session"),
    name: "Untitled.pdf",
    mode,
    sources: {},
    pages: {},
    pageOrder: [],
    objects: {},
    formValues: [],
    pageNumbers: defaultPageNumbers(),
    dirty: false,
    tool: "select",
    selectedObjectIds: [],
    selectedPageIds: [],
    currentPageId: null,
    zoom: 1,
    fitMode: "width",
    viewMode: "continuous",
    snapGrid: false,
    processing: null,
    error: null,
  };
}

type Store = {
  session: DocumentSession | null;
  history: HistoryState;
  ui: {
    leftOpen: boolean;
    rightOpen: boolean;
    fullscreen: boolean;
  };
  commit: (label: string, mutator: (s: DocumentSession) => DocumentSession, coalesceKey?: string) => void;
  undo: () => void;
  redo: () => void;
  setTool: (t: EditorTool) => void;
  setZoom: (z: number) => void;
  setMode: (m: StudioMode) => void;
  setName: (name: string) => void;
  setError: (e: string | null) => void;
  setProcessing: (p: string | null) => void;
  selectPages: (ids: string[]) => void;
  selectObjects: (ids: string[]) => void;
  setCurrentPage: (id: string | null) => void;
  toggleUi: (key: "leftOpen" | "rightOpen" | "fullscreen") => void;
  closeSession: () => void;
  openFromBytes: (bytes: Uint8Array, name: string, mode?: StudioMode) => Promise<void>;
  openMultiple: (files: { bytes: Uint8Array; name: string }[], mode?: StudioMode) => Promise<void>;
  openBlank: (size: keyof typeof PAGE_SIZES, landscape?: boolean) => Promise<void>;
  addObject: (obj: EditObject) => void;
  updateObject: (id: string, patch: Partial<EditObject>, coalesceKey?: string) => void;
  deleteSelectedObjects: () => void;
  rotateSelectedPages: (delta: 90 | -90) => void;
  deleteSelectedPages: () => void;
  duplicateSelectedPages: () => void;
  insertBlankPage: (afterIndex?: number) => void;
  reorderPage: (from: number, to: number) => void;
  markClean: () => void;
};

export const usePdfStore = create<Store>((set, get) => ({
  session: null,
  history: emptyHistory(),
  ui: { leftOpen: true, rightOpen: true, fullscreen: false },

  commit(label, mutator, coalesceKey) {
    const { session, history } = get();
    if (!session) return;
    const snap = snapshotFrom(session);
    const next = mutator(session);
    set({
      session: { ...next, dirty: true, error: null },
      history: pushHistory(history, snap, coalesceKey),
    });
  },

  undo() {
    const { session, history } = get();
    if (!session) return;
    const res = undoHistory(history, snapshotFrom(session));
    if (!res) return;
    set({ session: applySnapshot(session, res.snapshot), history: res.hist });
  },

  redo() {
    const { session, history } = get();
    if (!session) return;
    const res = redoHistory(history, snapshotFrom(session));
    if (!res) return;
    set({ session: applySnapshot(session, res.snapshot), history: res.hist });
  },

  setTool(t) {
    const s = get().session;
    if (!s) return;
    set({ session: { ...s, tool: t } });
  },

  setZoom(z) {
    const s = get().session;
    if (!s) return;
    set({ session: { ...s, zoom: Math.min(4, Math.max(0.25, z)), fitMode: "custom" } });
  },

  setMode(m) {
    const s = get().session;
    if (!s) return;
    set({ session: { ...s, mode: m } });
  },

  setName(name) {
    get().commit("rename", (s) => ({ ...s, name }));
  },

  setError(e) {
    const s = get().session;
    if (!s) {
      set({ session: { ...emptySession(), error: e } });
      return;
    }
    set({ session: { ...s, error: e } });
  },

  setProcessing(p) {
    const s = get().session;
    if (!s) return;
    set({ session: { ...s, processing: p } });
  },

  selectPages(ids) {
    const s = get().session;
    if (!s) return;
    set({
      session: {
        ...s,
        selectedPageIds: ids,
        currentPageId: ids[0] ?? s.currentPageId,
      },
    });
  },

  selectObjects(ids) {
    const s = get().session;
    if (!s) return;
    set({ session: { ...s, selectedObjectIds: ids } });
  },

  setCurrentPage(id) {
    const s = get().session;
    if (!s) return;
    set({ session: { ...s, currentPageId: id } });
  },

  toggleUi(key) {
    set({ ui: { ...get().ui, [key]: !get().ui[key] } });
  },

  closeSession() {
    set({ session: null, history: emptyHistory() });
  },

  async openFromBytes(bytes, name, mode = "editor") {
    const v = validatePdfBytes(bytes, name);
    if (!v.ok) {
      set({ session: { ...emptySession(mode), error: v.error } });
      return;
    }
    set({ session: { ...emptySession(mode), processing: "Opening PDF…" } });
    try {
      const pdf = await loadPdfDocument(bytes);
      const sourceId = newId("doc");
      const source: SourceDoc = {
        id: sourceId,
        name,
        bytes,
        pageCount: pdf.numPages,
        byteLength: bytes.byteLength,
        encrypted: false,
      };
      const pages: Record<string, PageModel> = {};
      const pageOrder: string[] = [];
      for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1);
        const vp = page.getViewport({ scale: 1 });
        const id = newId("page");
        pages[id] = {
          id,
          sourceDocId: sourceId,
          sourcePageIndex: i,
          width: vp.width,
          height: vp.height,
          rotation: 0,
        };
        pageOrder.push(id);
      }
      set({
        session: {
          ...emptySession(mode),
          name,
          sources: { [sourceId]: source },
          pages,
          pageOrder,
          currentPageId: pageOrder[0] ?? null,
          selectedPageIds: pageOrder[0] ? [pageOrder[0]] : [],
          dirty: false,
        },
        history: emptyHistory(),
      });
    } catch {
      set({
        session: {
          ...emptySession(mode),
          error: "Could not open this PDF. It may be corrupted or unsupported.",
        },
      });
    }
  },

  async openMultiple(files, mode = "merge") {
    if (!files.length) return;
    if (files.length === 1) {
      await get().openFromBytes(files[0].bytes, files[0].name, mode);
      return;
    }
    // Merge into one session page list
    set({ session: { ...emptySession(mode), processing: "Opening PDFs…" } });
    try {
      const sources: Record<string, SourceDoc> = {};
      const pages: Record<string, PageModel> = {};
      const pageOrder: string[] = [];
      let name = "merged.pdf";
      for (const f of files) {
        const v = validatePdfBytes(f.bytes, f.name);
        if (!v.ok) throw new Error(v.error);
        const pdf = await loadPdfDocument(f.bytes);
        const sourceId = newId("doc");
        sources[sourceId] = {
          id: sourceId,
          name: f.name,
          bytes: f.bytes,
          pageCount: pdf.numPages,
          byteLength: f.bytes.byteLength,
          encrypted: false,
        };
        for (let i = 0; i < pdf.numPages; i++) {
          const page = await pdf.getPage(i + 1);
          const vp = page.getViewport({ scale: 1 });
          const id = newId("page");
          pages[id] = {
            id,
            sourceDocId: sourceId,
            sourcePageIndex: i,
            width: vp.width,
            height: vp.height,
            rotation: 0,
          };
          pageOrder.push(id);
        }
      }
      set({
        session: {
          ...emptySession(mode),
          name,
          sources,
          pages,
          pageOrder,
          currentPageId: pageOrder[0] ?? null,
          selectedPageIds: pageOrder[0] ? [pageOrder[0]] : [],
          dirty: true,
        },
        history: emptyHistory(),
      });
    } catch (e) {
      set({
        session: {
          ...emptySession(mode),
          error: e instanceof Error ? e.message : "Could not open one of the PDFs.",
        },
      });
    }
  },

  async openBlank(size, landscape = false) {
    const dim = PAGE_SIZES[size];
    const w = landscape ? dim.height : dim.width;
    const h = landscape ? dim.width : dim.height;
    const bytes = await createBlankPdf(w, h, 1);
    const sourceId = newId("doc");
    const page = createBlankPage(size, landscape);
    page.sourceDocId = sourceId;
    set({
      session: {
        ...emptySession("editor"),
        name: "Untitled.pdf",
        sources: {
          [sourceId]: {
            id: sourceId,
            name: "blank.pdf",
            bytes,
            pageCount: 1,
            byteLength: bytes.byteLength,
            encrypted: false,
          },
        },
        pages: { [page.id]: { ...page, blank: false } },
        pageOrder: [page.id],
        currentPageId: page.id,
        selectedPageIds: [page.id],
        dirty: true,
      },
      history: emptyHistory(),
    });
  },

  addObject(obj) {
    get().commit("add object", (s) => ({
      ...s,
      objects: { ...s.objects, [obj.id]: obj },
      selectedObjectIds: [obj.id],
    }));
  },

  updateObject(id, patch, coalesceKey) {
    get().commit(
      "update object",
      (s) => {
        const prev = s.objects[id];
        if (!prev) return s;
        return {
          ...s,
          objects: { ...s.objects, [id]: { ...prev, ...patch } as EditObject },
        };
      },
      coalesceKey,
    );
  },

  deleteSelectedObjects() {
    get().commit("delete objects", (s) => {
      const objects = { ...s.objects };
      for (const id of s.selectedObjectIds) delete objects[id];
      return { ...s, objects, selectedObjectIds: [] };
    });
  },

  rotateSelectedPages(delta) {
    get().commit("rotate pages", (s) => {
      const pages = { ...s.pages };
      const ids = s.selectedPageIds.length ? s.selectedPageIds : s.currentPageId ? [s.currentPageId] : [];
      for (const id of ids) {
        if (pages[id]) pages[id] = rotatePage(pages[id], delta);
      }
      return { ...s, pages };
    });
  },

  deleteSelectedPages() {
    get().commit("delete pages", (s) => {
      const ids = new Set(s.selectedPageIds);
      if (!ids.size && s.currentPageId) ids.add(s.currentPageId);
      if (ids.size >= s.pageOrder.length) {
        return { ...s, error: "Cannot delete all pages. Keep at least one." };
      }
      const pages = { ...s.pages };
      const objects = { ...s.objects };
      for (const id of ids) {
        delete pages[id];
        for (const [oid, o] of Object.entries(objects)) {
          if (o.pageId === id) delete objects[oid];
        }
      }
      const pageOrder = s.pageOrder.filter((id) => !ids.has(id));
      return {
        ...s,
        pages,
        objects,
        pageOrder,
        selectedPageIds: pageOrder[0] ? [pageOrder[0]] : [],
        currentPageId: pageOrder[0] ?? null,
      };
    });
  },

  duplicateSelectedPages() {
    get().commit("duplicate pages", (s) => {
      const ids = s.selectedPageIds.length ? s.selectedPageIds : s.currentPageId ? [s.currentPageId] : [];
      const pages = { ...s.pages };
      const pageOrder = [...s.pageOrder];
      const newIds: string[] = [];
      for (const id of ids) {
        const p = pages[id];
        if (!p) continue;
        const dup = duplicatePage(p);
        pages[dup.id] = dup;
        const idx = pageOrder.indexOf(id);
        pageOrder.splice(idx + 1, 0, dup.id);
        newIds.push(dup.id);
      }
      return { ...s, pages, pageOrder, selectedPageIds: newIds };
    });
  },

  insertBlankPage(afterIndex) {
    get().commit("insert blank", (s) => {
      const blank = createBlankPage("A4");
      // Need a blank source — use createBlankPdf sync via existing first source dims
      const pages = { ...s.pages, [blank.id]: blank };
      const pageOrder = [...s.pageOrder];
      const idx = afterIndex ?? (s.currentPageId ? pageOrder.indexOf(s.currentPageId) : pageOrder.length - 1);
      pageOrder.splice(idx + 1, 0, blank.id);
      return {
        ...s,
        pages,
        pageOrder,
        selectedPageIds: [blank.id],
        currentPageId: blank.id,
      };
    });
  },

  reorderPage(from, to) {
    get().commit("reorder pages", (s) => ({
      ...s,
      pageOrder: reorderPages(s.pageOrder, from, to),
    }));
  },

  markClean() {
    const s = get().session;
    if (!s) return;
    set({ session: { ...s, dirty: false } });
  },
}));