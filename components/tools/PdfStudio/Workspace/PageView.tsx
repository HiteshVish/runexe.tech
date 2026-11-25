"use client";

import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Text, Line, Ellipse, Image as KonvaImage, Transformer } from "react-konva";
import type Konva from "konva";
import { loadPdfDocument, renderPageToCanvas } from "@/lib/pdf-studio/engines/pdfjs-loader";
import { usePdfStore } from "@/lib/pdf-studio/store";
import type { EditObject, PageModel, PenObject, ShapeObject, TextObject } from "@/lib/pdf-studio/types";
import { newId } from "@/lib/pdf-studio/types";
import type { PDFDocumentProxy } from "pdfjs-dist";

type Props = {
  page: PageModel;
  scale: number;
  docCache: Map<string, PDFDocumentProxy>;
};

function useHtmlImage(src: string | undefined) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) {
      setImg(null);
      return;
    }
    const i = new window.Image();
    i.crossOrigin = "anonymous";
    i.onload = () => setImg(i);
    i.src = src;
  }, [src]);
  return img;
}

function ObjNode({
  obj,
  scale,
  selected,
  onSelect,
  onChange,
}: {
  obj: EditObject;
  scale: number;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<EditObject>, coalesce?: string) => void;
}) {
  const shapeRef = useRef<Konva.Node>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const img = useHtmlImage(obj.type === "image" || obj.type === "signature" ? obj.src : undefined);

  useEffect(() => {
    if (selected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selected]);

  const common = {
    x: obj.x * scale,
    y: obj.y * scale,
    width: obj.width * scale,
    height: obj.height * scale,
    rotation: obj.rotation,
    opacity: obj.opacity,
    draggable: true,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      onChange({ x: e.target.x() / scale, y: e.target.y() / scale }, `drag-${obj.id}`);
    },
    onTransformEnd: () => {
      const node = shapeRef.current;
      if (!node) return;
      const sx = node.scaleX();
      const sy = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      onChange({
        x: node.x() / scale,
        y: node.y() / scale,
        width: Math.max(8, (node.width() * sx) / scale),
        height: Math.max(8, (node.height() * sy) / scale),
        rotation: node.rotation(),
      });
    },
  };

  let node: React.ReactNode = null;
  if (obj.type === "text") {
    const t = obj as TextObject;
    node = (
      <Text
        ref={shapeRef as never}
        {...common}
        text={t.text}
        fontSize={t.fontSize * scale}
        fontFamily={t.fontFamily}
        fill={t.color}
        fontStyle={t.bold ? "bold" : "normal"}
        align={t.align}
      />
    );
  } else if (obj.type === "image" || obj.type === "signature") {
    node = img ? <KonvaImage ref={shapeRef as never} {...common} image={img} /> : null;
  } else if (obj.type === "pen") {
    const p = obj as PenObject;
    const pts = p.points.map((v, i) => (i % 2 === 0 ? v * scale : v * scale));
    node = (
      <Line
        ref={shapeRef as never}
        points={pts}
        stroke={p.stroke}
        strokeWidth={p.strokeWidth * scale}
        tension={0.3}
        lineCap="round"
        lineJoin="round"
        opacity={p.opacity}
        onClick={onSelect}
        onTap={onSelect}
      />
    );
  } else if (obj.type === "ellipse") {
    const s = obj as ShapeObject;
    node = (
      <Ellipse
        ref={shapeRef as never}
        x={(obj.x + obj.width / 2) * scale}
        y={(obj.y + obj.height / 2) * scale}
        radiusX={(obj.width / 2) * scale}
        radiusY={(obj.height / 2) * scale}
        fill={s.fill}
        stroke={s.stroke}
        strokeWidth={s.strokeWidth}
        opacity={obj.opacity}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) =>
          onChange({
            x: e.target.x() / scale - obj.width / 2,
            y: e.target.y() / scale - obj.height / 2,
          })
        }
      />
    );
  } else if (obj.type === "line" || obj.type === "arrow" || obj.type === "underline" || obj.type === "strikethrough") {
    const s = obj as ShapeObject;
    node = (
      <Line
        ref={shapeRef as never}
        points={[obj.x * scale, (obj.y + obj.height / 2) * scale, (obj.x + obj.width) * scale, (obj.y + obj.height / 2) * scale]}
        stroke={s.stroke}
        strokeWidth={(s.strokeWidth || 2) * scale}
        opacity={obj.opacity}
        onClick={onSelect}
        onTap={onSelect}
      />
    );
  } else {
    const s = obj as ShapeObject;
    node = (
      <Rect
        ref={shapeRef as never}
        {...common}
        fill={s.fill}
        stroke={s.type === "rect" ? s.stroke : undefined}
        strokeWidth={s.strokeWidth}
      />
    );
  }

  return (
    <>
      {node}
      {selected && obj.type !== "pen" && <Transformer ref={trRef} rotateEnabled />}
    </>
  );
}

export default function PageView({ page, scale, docCache }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const session = usePdfStore((s) => s.session);
  const tool = session?.tool ?? "select";
  const selectedObjectIds = session?.selectedObjectIds ?? [];
  const addObject = usePdfStore((s) => s.addObject);
  const updateObject = usePdfStore((s) => s.updateObject);
  const selectObjects = usePdfStore((s) => s.selectObjects);
  const setCurrentPage = usePdfStore((s) => s.setCurrentPage);
  const [drawing, setDrawing] = useState<number[] | null>(null);

  const w = page.width * scale;
  const h = page.height * scale;
  const objects = Object.values(session?.objects ?? {})
    .filter((o) => o.pageId === page.id || (o.type === "watermark" && o.applyToAll))
    .sort((a, b) => a.zIndex - b.zIndex);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || page.blank) {
      if (canvas && page.blank) {
        const ctx = canvas.getContext("2d");
        canvas.width = w;
        canvas.height = h;
        if (ctx) {
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, w, h);
        }
      }
      return;
    }
    const src = session?.sources[page.sourceDocId];
    if (!src) return;
    let cancelled = false;
    const ac = new AbortController();
    (async () => {
      let doc = docCache.get(page.sourceDocId);
      if (!doc) {
        doc = await loadPdfDocument(src.bytes);
        docCache.set(page.sourceDocId, doc);
      }
      if (cancelled) return;
      await renderPageToCanvas(doc, page.sourcePageIndex, scale, canvas, ac.signal);
    })().catch(() => {});
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [page, scale, session?.sources, docCache, w, h]);

  function placeAt(x: number, y: number) {
    setCurrentPage(page.id);
    const z = objects.length + 1;
    if (tool === "text") {
      addObject({
        id: newId("obj"),
        pageId: page.id,
        type: "text",
        x: x / scale,
        y: y / scale,
        width: 200,
        height: 40,
        rotation: 0,
        opacity: 1,
        zIndex: z,
        text: "Text",
        fontFamily: "Helvetica",
        fontSize: 16,
        bold: false,
        italic: false,
        underline: false,
        color: "#111111",
        backgroundColor: null,
        align: "left",
        lineHeight: 1.25,
      } as TextObject);
      usePdfStore.getState().setTool("select");
      return;
    }
    const shapeTools = ["highlight", "rect", "whiteout", "ellipse", "check", "cross"] as const;
    if ((shapeTools as readonly string[]).includes(tool)) {
      const fills: Record<string, string> = {
        highlight: "#ffe066",
        whiteout: "#ffffff",
        rect: "transparent",
        ellipse: "transparent",
        check: "transparent",
        cross: "transparent",
      };
      addObject({
        id: newId("obj"),
        pageId: page.id,
        type: tool as ShapeObject["type"],
        x: x / scale,
        y: y / scale,
        width: tool === "highlight" || tool === "whiteout" ? 160 : 80,
        height: tool === "highlight" || tool === "whiteout" ? 28 : 80,
        rotation: 0,
        opacity: tool === "highlight" ? 0.4 : 1,
        zIndex: z,
        fill: fills[tool] ?? "#ffffff",
        stroke: "#111111",
        strokeWidth: 2,
      } as ShapeObject);
      usePdfStore.getState().setTool("select");
    }
  }

  return (
    <div className="ps-page-view" style={{ width: w, height: h }} data-page-id={page.id}>
      <canvas ref={canvasRef} className="pdf-layer" width={w} height={h} />
      <div className="ps-overlay">
        <Stage
          width={w}
          height={h}
          onMouseDown={(e) => {
            if (tool === "pan") return;
            const stage = e.target.getStage();
            if (!stage) return;
            const pos = stage.getPointerPosition();
            if (!pos) return;
            if (e.target === stage) {
              if (tool === "pen") {
                setDrawing([pos.x / scale, pos.y / scale]);
                return;
              }
              if (tool !== "select") placeAt(pos.x, pos.y);
              else selectObjects([]);
            }
          }}
          onMouseMove={(e) => {
            if (!drawing) return;
            const pos = e.target.getStage()?.getPointerPosition();
            if (!pos) return;
            setDrawing([...drawing, pos.x / scale, pos.y / scale]);
          }}
          onMouseUp={() => {
            if (drawing && drawing.length >= 4) {
              const xs = drawing.filter((_, i) => i % 2 === 0);
              const ys = drawing.filter((_, i) => i % 2 === 1);
              const minX = Math.min(...xs);
              const minY = Math.min(...ys);
              addObject({
                id: newId("obj"),
                pageId: page.id,
                type: "pen",
                x: minX,
                y: minY,
                width: Math.max(...xs) - minX,
                height: Math.max(...ys) - minY,
                rotation: 0,
                opacity: 1,
                zIndex: objects.length + 1,
                points: drawing,
                stroke: "#111111",
                strokeWidth: 2,
              } as PenObject);
              usePdfStore.getState().setTool("select");
            }
            setDrawing(null);
          }}
        >
          <Layer>
            {objects.map((obj) => (
              <ObjNode
                key={obj.id}
                obj={obj}
                scale={scale}
                selected={selectedObjectIds.includes(obj.id)}
                onSelect={() => selectObjects([obj.id])}
                onChange={(patch, key) => updateObject(obj.id, patch, key)}
              />
            ))}
            {drawing && (
              <Line
                points={drawing.map((v) => v * scale)}
                stroke="#111"
                strokeWidth={2}
                tension={0.3}
                lineCap="round"
              />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}