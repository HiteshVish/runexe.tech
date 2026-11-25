"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DevToolHeader from "@/components/tools/DevToolHeader";
import { processImage } from "@/lib/image/compress";
import { parseSizeInput } from "@/lib/image/formats";
import { validateFile } from "@/lib/image/compress";
import "@/styles/image-compressor.css";
import Controls from "./Controls";
import Dropzone from "./Dropzone";
import EmptyState from "./EmptyState";
import FileList from "./FileList";
import Preview from "./Preview";
import ResultCard from "./ResultCard";
import TargetSizeNav from "./TargetSizeNav";
import type { CompressorSettings, FileItemState } from "./types";
import type { CompressTargetSlug } from "@/lib/image/target-sizes";

export type ImageCompressorAppProps = {
  headerTitle?: string;
  headerLead?: string;
  initialCompressionMode?: "quality" | "target";
  initialTargetBytes?: number;
  showTargetSizeNav?: boolean;
  landingSlug?: CompressTargetSlug;
};

function defaultSettings(initialTargetBytes?: number): CompressorSettings {
  const bytes = initialTargetBytes ?? 100 * 1024;
  const isMb = bytes >= 1024 * 1024;
  return {
    compressionMode: initialTargetBytes ? "target" : "quality",
    quality: 80,
    targetBytes: bytes,
    targetUnit: isMb ? "MB" : "KB",
    targetInput: isMb ? "1" : String(bytes / 1024),
    resizeWidth: "",
    resizeHeight: "",
    lockAspect: true,
    scalePercent: "",
    fit: "contain",
    backgroundColor: "#ffffff",
    outputFormat: "jpeg",
  };
}

function toProcessSettings(s: CompressorSettings) {
  const targetFromInput = parseSizeInput(s.targetInput, s.targetUnit);
  const targetBytes = s.compressionMode === "target" ? (targetFromInput ?? s.targetBytes) : null;
  const rw = s.resizeWidth.trim() ? parseInt(s.resizeWidth, 10) : null;
  const rh = s.resizeHeight.trim() ? parseInt(s.resizeHeight, 10) : null;
  const scale = s.scalePercent.trim() ? parseFloat(s.scalePercent) : null;
  return {
    compressionMode: s.compressionMode,
    quality: s.quality,
    targetBytes,
    resizeWidth: Number.isFinite(rw) ? rw : null,
    resizeHeight: Number.isFinite(rh) ? rh : null,
    lockAspect: s.lockAspect,
    scalePercent: Number.isFinite(scale!) ? scale : null,
    fit: s.fit,
    backgroundColor: s.backgroundColor,
    outputFormat: s.outputFormat,
  };
}

export default function ImageCompressorApp({
  headerTitle = "Image Compressor & Resizer",
  headerLead = "Shrink and resize JPG, PNG or WebP images. Runs in your browser. Nothing is uploaded.",
  initialCompressionMode,
  initialTargetBytes,
  showTargetSizeNav = true,
  landingSlug,
}: ImageCompressorAppProps) {
  const [settings, setSettings] = useState(() => {
    const base = defaultSettings(initialTargetBytes);
    if (initialCompressionMode) base.compressionMode = initialCompressionMode;
    return base;
  });
  const [items, setItems] = useState<FileItemState[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [liveMsg, setLiveMsg] = useState("");
  const urlsRef = useRef<string[]>([]);
  const applySeq = useRef(0);
  const prevItemCount = useRef(0);
  const itemsRef = useRef(items);
  const settingsRef = useRef(settings);
  const activeIdRef = useRef(activeId);
  itemsRef.current = items;
  settingsRef.current = settings;
  activeIdRef.current = activeId;

  const trackUrl = (url: string) => {
    urlsRef.current.push(url);
  };

  useEffect(() => {
    return () => {
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const files = e.clipboardData?.files;
      if (!files?.length) return;
      addFiles(Array.from(files));
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  const activeItem = useMemo(
    () => items.find((i) => i.id === activeId) ?? items[0] ?? null,
    [items, activeId],
  );

  const addFiles = useCallback((files: File[]) => {
    const next: FileItemState[] = [];
    for (const file of files) {
      const err = validateFile(file);
      if (err) {
        alert(`${file.name}: ${err}`);
        continue;
      }
      const id = crypto.randomUUID();
      const originalUrl = URL.createObjectURL(file);
      trackUrl(originalUrl);
      next.push({
        id,
        file,
        status: "idle",
        originalUrl,
      });
    }
    if (!next.length) return;
    setItems((prev) => [...prev, ...next]);
    setActiveId((cur) => cur ?? next[0].id);
    setLiveMsg(`Added ${next.length} file${next.length === 1 ? "" : "s"}.`);
  }, []);

  const processSettings = useMemo(() => toProcessSettings(settings), [settings]);

  const applyAll = useCallback(async () => {
    const seq = ++applySeq.current;
    const queue = [...itemsRef.current];
    if (!queue.length) return;

    const priority = activeIdRef.current;
    if (priority) {
      const idx = queue.findIndex((i) => i.id === priority);
      if (idx > 0) {
        const [first] = queue.splice(idx, 1);
        queue.unshift(first);
      }
    }

    const opts = toProcessSettings(settingsRef.current);
    setBusy(true);
    setLiveMsg("Updating preview…");
    let ok = 0;

    for (let i = 0; i < queue.length; i++) {
      if (seq !== applySeq.current) {
        setBusy(false);
        return;
      }
      const item = queue[i];
      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, status: "processing", error: undefined } : x)),
      );
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));
      try {
        const result = await processImage(item.file, opts);
        const previewUrl = URL.createObjectURL(result.usedOriginal ? item.file : result.blob);
        trackUrl(previewUrl);
        setItems((prev) =>
          prev.map((x) => {
            if (x.id !== item.id) return x;
            if (x.previewUrl && x.previewUrl !== x.originalUrl) {
              URL.revokeObjectURL(x.previewUrl);
            }
            return { ...x, status: "done", result, previewUrl, error: undefined };
          }),
        );
        ok++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Processing failed.";
        setItems((prev) =>
          prev.map((x) => (x.id === item.id ? { ...x, status: "error", error: msg } : x)),
        );
      }
    }
    if (seq === applySeq.current) {
      setBusy(false);
      setLiveMsg(ok ? `${ok} file${ok === 1 ? "" : "s"} ready to download.` : "No files processed.");
    }
  }, []);

  useEffect(() => {
    if (!items.length) {
      prevItemCount.current = 0;
      return;
    }
    const added = items.length > prevItemCount.current;
    prevItemCount.current = items.length;
    const ms = added ? 80 : 400;
    const t = window.setTimeout(() => {
      void applyAll();
    }, ms);
    return () => clearTimeout(t);
  }, [items.length, processSettings, applyAll]);

  return (
    <div className="dt-page tool-page ic-page">
      <div className="dt-wrap">
        <DevToolHeader
          title={headerTitle}
          lead={headerLead}
          badges={["Runs in your browser", "Nothing is uploaded", "No signup"]}
        />
        <p className="ic-privacy">Runs in your browser. Nothing is uploaded.</p>

        {!items.length && <EmptyState />}
        <Dropzone disabled={busy} onFiles={addFiles} />

        <p aria-live="polite" className="dt-status" style={{ marginTop: 10 }}>
          {liveMsg}
        </p>

        {items.length > 0 && (
          <>
            <FileList items={items} activeId={activeItem?.id ?? null} onSelect={setActiveId} />
            <div className="ic-layout">
              <div className="dt-panel">
                <Controls
                  settings={settings}
                  disabled={busy}
                  hasFiles={items.length > 0}
                  onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
                />
              </div>
              <div className="dt-panel">
                <p className="ic-section-title">Preview</p>
                <Preview item={activeItem} />
              </div>
            </div>
            <ResultCard items={items} settings={settings} activeId={activeItem?.id} />
          </>
        )}

        {showTargetSizeNav && <TargetSizeNav currentSlug={landingSlug} />}
      </div>
    </div>
  );
}