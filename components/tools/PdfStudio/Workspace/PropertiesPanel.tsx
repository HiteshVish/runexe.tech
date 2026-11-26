"use client";

import { FONT_CHOICES } from "@/lib/pdf-studio/constants";
import { usePdfStore } from "@/lib/pdf-studio/store";
import type { TextObject } from "@/lib/pdf-studio/types";
import ModePanels from "../tools/ModePanels";

export default function PropertiesPanel({ open }: { open: boolean }) {
  const session = usePdfStore((s) => s.session);
  const updateObject = usePdfStore((s) => s.updateObject);
  const commit = usePdfStore((s) => s.commit);

  if (!session) return null;
  const objId = session.selectedObjectIds[0];
  const obj = objId ? session.objects[objId] : null;

  return (
    <aside className={`ps-sidebar ps-sidebar--right${open ? " is-drawer" : ""}`} style={{ display: open ? undefined : "none" }}>
      <ModePanels />

      <div className="ps-block ps-props">
        <h3>Properties</h3>
        {!obj && <p className="ps-empty">Select an object on the page to edit its properties.</p>}
        {obj?.type === "text" && (
          <>
            <label>Text</label>
            <textarea
              rows={3}
              value={(obj as TextObject).text}
              onChange={(e) => updateObject(obj.id, { text: e.target.value } as Partial<TextObject>, `text-${obj.id}`)}
            />
            <label>Font</label>
            <select
              value={(obj as TextObject).fontFamily}
              onChange={(e) => updateObject(obj.id, { fontFamily: e.target.value } as Partial<TextObject>)}
            >
              {FONT_CHOICES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <label>Size</label>
            <input
              type="number"
              value={(obj as TextObject).fontSize}
              onChange={(e) => updateObject(obj.id, { fontSize: Number(e.target.value) } as Partial<TextObject>)}
            />
            <label>Color</label>
            <input
              type="color"
              value={(obj as TextObject).color}
              onChange={(e) => updateObject(obj.id, { color: e.target.value } as Partial<TextObject>)}
            />
            <label className="ps-check">
              <input
                type="checkbox"
                checked={(obj as TextObject).bold}
                onChange={(e) => updateObject(obj.id, { bold: e.target.checked } as Partial<TextObject>)}
              />
              Bold
            </label>
          </>
        )}
        {obj && obj.type !== "text" && (
          <>
            <label>Opacity</label>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={obj.opacity}
              onChange={(e) => updateObject(obj.id, { opacity: Number(e.target.value) }, `op-${obj.id}`)}
            />
            <label>Rotation</label>
            <input
              type="number"
              value={obj.rotation}
              onChange={(e) => updateObject(obj.id, { rotation: Number(e.target.value) })}
            />
            {"fill" in obj && (
              <>
                <label>Fill</label>
                <input
                  type="color"
                  value={(obj as { fill: string }).fill === "transparent" ? "#ffffff" : (obj as { fill: string }).fill}
                  onChange={(e) => updateObject(obj.id, { fill: e.target.value } as never)}
                />
              </>
            )}
            {"stroke" in obj && (
              <>
                <label>Stroke</label>
                <input
                  type="color"
                  value={(obj as { stroke: string }).stroke}
                  onChange={(e) => updateObject(obj.id, { stroke: e.target.value } as never)}
                />
              </>
            )}
          </>
        )}
      </div>

      <div className="ps-block">
        <h3>Page numbers</h3>
        <label className="ps-check">
          <input
            type="checkbox"
            checked={session.pageNumbers.enabled}
            onChange={(e) =>
              commit("page numbers", (s) => ({
                ...s,
                pageNumbers: { ...s.pageNumbers, enabled: e.target.checked },
              }))
            }
          />
          Enable page numbers
        </label>
        <label>Format</label>
        <select
          value={session.pageNumbers.format}
          onChange={(e) =>
            commit("page number format", (s) => ({
              ...s,
              pageNumbers: {
                ...s.pageNumbers,
                format: e.target.value as typeof s.pageNumbers.format,
              },
            }))
          }
        >
          <option value="n">1</option>
          <option value="page-n">Page 1</option>
          <option value="page-n-of-m">Page 1 of N</option>
        </select>
      </div>
    </aside>
  );
}
