"use client";

import type { EditorTool } from "@/lib/pdf-studio/types";
import type { StudioMode } from "@/lib/pdf-studio/constants";
import { usePdfStore } from "@/lib/pdf-studio/store";
import { Ico } from "../icons";

const ANNOTATE_MODES: StudioMode[] = ["editor", "add-text", "sign", "watermark", "organize", "rotate", "remove-pages"];

const GROUPS: { sep?: boolean; id: EditorTool; label: string; tip: string; icon: React.ReactNode }[] = [
  { id: "select", label: "Select", tip: "Select", icon: Ico.select },
  { id: "pan", label: "Pan", tip: "Pan canvas", icon: Ico.pan },
  { sep: true, id: "text", label: "Text", tip: "Add text", icon: Ico.text },
  { id: "image", label: "Image", tip: "Add image", icon: Ico.image },
  { sep: true, id: "highlight", label: "Highlight", tip: "Highlight", icon: Ico.highlight },
  { id: "underline", label: "Underline", tip: "Underline", icon: Ico.line },
  { id: "strikethrough", label: "Strike", tip: "Strikethrough", icon: Ico.line },
  { id: "pen", label: "Pen", tip: "Draw", icon: Ico.pen },
  { sep: true, id: "rect", label: "Rect", tip: "Rectangle", icon: Ico.rect },
  { id: "ellipse", label: "Ellipse", tip: "Ellipse", icon: Ico.ellipse },
  { id: "line", label: "Line", tip: "Line", icon: Ico.line },
  { id: "arrow", label: "Arrow", tip: "Arrow", icon: Ico.arrow },
  { id: "check", label: "Check", tip: "Checkmark", icon: Ico.check },
  { id: "cross", label: "Cross", tip: "Cross", icon: Ico.cross },
  { sep: true, id: "signature", label: "Sign", tip: "Electronic signature", icon: Ico.sign },
  {
    id: "whiteout",
    label: "Whiteout",
    tip: "Whiteout — visual cover, not secure redaction",
    icon: Ico.whiteout,
  },
];

export default function EditorToolbar() {
  const tool = usePdfStore((s) => s.session?.tool ?? "select");
  const mode = usePdfStore((s) => s.session?.mode ?? "editor");
  const setTool = usePdfStore((s) => s.setTool);
  const deleteSelectedObjects = usePdfStore((s) => s.deleteSelectedObjects);
  const addObject = usePdfStore((s) => s.addObject);
  const session = usePdfStore((s) => s.session);

  const showFull = ANNOTATE_MODES.includes(mode);

  function onImagePick(file: File) {
    if (!session?.currentPageId) return;
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const maxW = 240;
      const sc = Math.min(1, maxW / img.width);
      addObject({
        id: `obj_${Date.now().toString(36)}`,
        pageId: session.currentPageId!,
        type: "image",
        x: 72,
        y: 72,
        width: img.width * sc,
        height: img.height * sc,
        rotation: 0,
        opacity: 1,
        zIndex: Object.keys(session.objects).length + 1,
        src: url,
        lockAspect: true,
      });
      setTool("select");
    };
    img.src = url;
  }

  if (!showFull) {
    return (
      <div className="ps-toolbar" role="toolbar" aria-label="Task tools">
        <span className="ps-toolbar-hint">Use the panel on the right, then Download when ready.</span>
      </div>
    );
  }

  return (
    <div className="ps-toolbar" role="toolbar" aria-label="Editing tools">
      {GROUPS.map((t, i) => (
        <span key={t.id} style={{ display: "contents" }}>
          {t.sep && i > 0 && <span className="ps-tool-sep" aria-hidden />}
          <button
            type="button"
            className="ps-btn ps-btn--icon"
            aria-label={t.label}
            aria-pressed={tool === t.id}
            title={t.tip}
            onClick={() => {
              if (t.id === "image") {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/png,image/jpeg,image/webp";
                input.onchange = () => {
                  const f = input.files?.[0];
                  if (f) onImagePick(f);
                };
                input.click();
                return;
              }
              setTool(t.id);
            }}
          >
            {t.icon}
          </button>
        </span>
      ))}
      <span className="ps-tool-sep" aria-hidden />
      <button type="button" className="ps-btn ps-btn--icon" aria-label="Delete" title="Delete selected" onClick={() => deleteSelectedObjects()}>
        {Ico.trash}
      </button>
    </div>
  );
}