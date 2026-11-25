"use client";

import type { EditorTool } from "@/lib/pdf-studio/types";
import { usePdfStore } from "@/lib/pdf-studio/store";

const TOOLS: { id: EditorTool; label: string }[] = [
  { id: "select", label: "Select" },
  { id: "pan", label: "Pan" },
  { id: "text", label: "Text" },
  { id: "image", label: "Image" },
  { id: "highlight", label: "Highlight" },
  { id: "underline", label: "Underline" },
  { id: "strikethrough", label: "Strike" },
  { id: "pen", label: "Pen" },
  { id: "rect", label: "Rect" },
  { id: "ellipse", label: "Ellipse" },
  { id: "line", label: "Line" },
  { id: "arrow", label: "Arrow" },
  { id: "check", label: "Check" },
  { id: "cross", label: "Cross" },
  { id: "signature", label: "Sign" },
  { id: "whiteout", label: "Whiteout" },
];

export default function EditorToolbar() {
  const tool = usePdfStore((s) => s.session?.tool ?? "select");
  const setTool = usePdfStore((s) => s.setTool);
  const deleteSelectedObjects = usePdfStore((s) => s.deleteSelectedObjects);
  const addObject = usePdfStore((s) => s.addObject);
  const session = usePdfStore((s) => s.session);

  function onImagePick(file: File) {
    if (!session?.currentPageId) return;
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const maxW = 240;
      const scale = Math.min(1, maxW / img.width);
      addObject({
        id: `obj_${Date.now().toString(36)}`,
        pageId: session.currentPageId!,
        type: "image",
        x: 72,
        y: 72,
        width: img.width * scale,
        height: img.height * scale,
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

  return (
    <div className="ps-toolbar" role="toolbar" aria-label="Editing tools">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          type="button"
          className="ps-btn"
          aria-pressed={tool === t.id}
          title={t.id === "whiteout" ? "Whiteout (visual cover — not secure redaction)" : t.label}
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
          {t.label}
        </button>
      ))}
      <button type="button" className="ps-btn" onClick={() => deleteSelectedObjects()}>
        Delete
      </button>
    </div>
  );
}