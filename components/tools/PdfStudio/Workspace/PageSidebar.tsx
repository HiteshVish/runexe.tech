"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import { loadPdfDocument, renderThumb } from "@/lib/pdf-studio/engines/pdfjs-loader";
import { usePdfStore } from "@/lib/pdf-studio/store";
import { Ico } from "../icons";

function SortableThumb({
  id,
  index,
  selected,
  current,
  thumb,
  onSelect,
}: {
  id: string;
  index: number;
  selected: boolean;
  current: boolean;
  thumb?: string;
  onSelect: (e: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <li ref={setNodeRef} style={style}>
      <button
        type="button"
        className={`ps-thumb${selected ? " is-selected" : ""}`}
        aria-current={current ? "true" : undefined}
        onClick={onSelect}
        {...attributes}
        {...listeners}
      >
        {thumb ? <img src={thumb} alt="" /> : <div className="ps-thumb-placeholder" />}
        <span>{index + 1}</span>
      </button>
    </li>
  );
}

export default function PageSidebar({ open }: { open: boolean }) {
  const session = usePdfStore((s) => s.session);
  const selectPages = usePdfStore((s) => s.selectPages);
  const rotateSelectedPages = usePdfStore((s) => s.rotateSelectedPages);
  const deleteSelectedPages = usePdfStore((s) => s.deleteSelectedPages);
  const duplicateSelectedPages = usePdfStore((s) => s.duplicateSelectedPages);
  const insertBlankPage = usePdfStore((s) => s.insertBlankPage);
  const commit = usePdfStore((s) => s.commit);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      const docCache = new Map();
      for (const id of session.pageOrder.slice(0, 80)) {
        const p = session.pages[id];
        if (!p || p.blank) continue;
        const src = session.sources[p.sourceDocId];
        if (!src) continue;
        try {
          let doc = docCache.get(p.sourceDocId);
          if (!doc) {
            doc = await loadPdfDocument(src.bytes);
            docCache.set(p.sourceDocId, doc);
          }
          next[id] = await renderThumb(doc, p.sourcePageIndex, 100);
        } catch {
          /* skip */
        }
        if (cancelled) return;
      }
      if (!cancelled) setThumbs((t) => ({ ...t, ...next }));
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.pageOrder, session?.pages, session?.sources, session]);

  if (!session) return null;

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id || !session) return;
    const oldIndex = session.pageOrder.indexOf(String(active.id));
    const newIndex = session.pageOrder.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    commit("reorder", (s) => ({
      ...s,
      pageOrder: arrayMove(s.pageOrder, oldIndex, newIndex),
    }));
  }

  return (
    <aside className={`ps-sidebar${open ? " is-drawer" : ""}`} style={{ display: open ? undefined : "none" }}>
      <div className="ps-film-actions">
        <button type="button" className="ps-btn ps-btn--icon" title="Rotate" aria-label="Rotate" onClick={() => rotateSelectedPages(90)}>
          {Ico.rotate}
        </button>
        <button type="button" className="ps-btn ps-btn--icon" title="Duplicate" aria-label="Duplicate" onClick={() => duplicateSelectedPages()}>
          {Ico.dup}
        </button>
        <button type="button" className="ps-btn ps-btn--icon" title="Delete page" aria-label="Delete page" onClick={() => deleteSelectedPages()}>
          {Ico.trash}
        </button>
        <button type="button" className="ps-btn" title="Insert blank" onClick={() => insertBlankPage()}>
          +
        </button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={session.pageOrder} strategy={verticalListSortingStrategy}>
          <ul className="ps-thumbs">
            {session.pageOrder.map((id, index) => (
              <SortableThumb
                key={id}
                id={id}
                index={index}
                selected={session.selectedPageIds.includes(id)}
                current={session.currentPageId === id}
                thumb={thumbs[id]}
                onSelect={(e) => {
                  if (e.shiftKey || e.metaKey || e.ctrlKey) {
                    const set = new Set(session.selectedPageIds);
                    if (set.has(id)) set.delete(id);
                    else set.add(id);
                    selectPages([...set]);
                  } else {
                    selectPages([id]);
                  }
                }}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </aside>
  );
}