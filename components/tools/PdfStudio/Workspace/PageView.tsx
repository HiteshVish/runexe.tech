"use client";

import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Text, Line, Ellipse, Arrow, Image as KonvaImage, Transformer } from "react-konva";
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

const DRAG_SHAPE_TOOLS = ["line", "arrow", "underline", "strikethrough", "highlight", "whiteout", "rect", "ellipse"] as const;

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
    const pts = p.points.map((v) => v * scale);
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
        fill={s.fill === "transparent" ? undefined : s.fill}
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
  } else if (obj.type === "arrow") {
    const s = obj as ShapeObject;
    node = (
      <Arrow
        ref={shapeRef as never}
        points={[obj.x * scale, (obj.y + obj.height / 2) * scale, (obj.x + obj.width) * scale, (obj.y + obj.height / 2) * scale]}
        stroke={s.stroke}
        fill={s.stroke}
        strokeWidth={(s.strokeWidth || 2) * scale}
        pointerLength={10}
        pointerWidth={10}
        opacity={obj.opacity}
        onClick={onSelect}
        onTap={onSelect}
      />
    );
  } else if (obj.type === "line" || obj.type === "underline" || obj.type === "strikethrough") {
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
        fill={s.fill === "transparent" ? undefined : s.fill}
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const session = usePdfStore((s) => s.session);
  const tool = session?.tool ?? "select";
  const selectedObjectIds = session?.selectedObjectIds ?? [];
  const addObject = usePdfStore((s) => s.addObject);
  const updateObject = usePdfStore((s) => s.updateObject);
  const selectObjects = usePdfStore((s) => s.selectObjects);
  const setCurrentPage = usePdfStore((s) => s.setCurrentPage);
  const [drawing, setDrawing] = useState<number[] | null>(null);
  const [dragShape, setDragShape] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const panRef = useRef<{ x: number; y: number; sl: number; st: number } | null>(null);

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

  function placeText(x: number, y: number) {
    setCurrentPage(page.id);
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
      zIndex: objects.length + 1,
      text: "Double-click to edit",
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
  }

  function placeStamp(x: number, y: number, type: "check" | "cross" | "signature") {
    setCurrentPage(page.id);
    if (type === "signature") {
      usePdfStore.getState().setTool("signature");
      return;
    }
    addObject({
      id: newId("obj"),
      pageId: page.id,
      type,
      x: x / scale,
      y: y / scale,
      width: 48,
      height: 48,
      rotation: 0,
      opacity: 1,
      zIndex: objects.length + 1,
      fill: "transparent",
      stroke: type === "check" ? "#1a7f37" : "#b00020",
      strokeWidth: 3,
    } as ShapeObject);
    usePdfStore.getState().setTool("select");
  }

  function finishDragShape(x0: number, y0: number, x1: number, y1: number) {
    const minX = Math.min(x0, x1) / scale;
    const minY = Math.min(y0, y1) / scale;
    const width = Math.max(8, Math.abs(x1 - x0) / scale);
    const height = Math.max(4, Math.abs(y1 - y0) / scale);
    const fills: Record<string, string> = {
      highlight: "#ffe066",
      whiteout: "#ffffff",
      rect: "transparent",
      ellipse: "transparent",
      line: "transparent",
      arrow: "transparent",
      underline: "transparent",
      strikethrough: "transparent",
    };
    addObject({
      id: newId("obj"),
      pageId: page.id,
      type: tool as ShapeObject["type"],
      x: minX,
      y: minY,
      width,
      height: tool === "line" || tool === "arrow" || tool === "underline" || tool === "strikethrough" ? Math.max(height, 8) : height,
      rotation: 0,
      opacity: tool === "highlight" ? 0.4 : 1,
      zIndex: objects.length + 1,
      fill: fills[tool] ?? "#ffffff",
      stroke: tool === "highlight" ? "#ffe066" : "#111111",
      strokeWidth: tool === "underline" || tool === "strikethrough" ? 2 : 2,
    } as ShapeObject);
    usePdfStore.getState().setTool("select");
  }

  function onPointerDown(e: Konva.KonvaEventObject<PointerEvent>) {
    if (tool === "pan") {
      const scroller = wrapRef.current?.closest(".ps-canvas-wrap");
      if (scroller) {
        panRef.current = { x: e.evt.clientX, y: e.evt.clientY, sl: scroller.scrollLeft, st: scroller.scrollTop };
      }
      return;
    }
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    if (e.target !== stage) return;

    setCurrentPage(page.id);
    if (tool === "pen") {
      setDrawing([pos.x / scale, pos.y / scale]);
      return;
    }
    if (tool === "text") {
      placeText(pos.x, pos.y);
      return;
    }
    if (tool === "check" || tool === "cross" || tool === "signature") {
      placeStamp(pos.x, pos.y, tool);
      return;
    }
    if ((DRAG_SHAPE_TOOLS as readonly string[]).includes(tool)) {
      setDragShape({ x0: pos.x, y0: pos.y, x1: pos.x, y1: pos.y });
      return;
    }
    if (tool === "select") selectObjects([]);
  }

  function onPointerMove(e: Konva.KonvaEventObject<PointerEvent>) {
    if (tool === "pan" && panRef.current) {
      const scroller = wrapRef.current?.closest(".ps-canvas-wrap");
      if (scroller) {
        scroller.scrollLeft = panRef.current.sl - (e.evt.clientX - panRef.current.x);
        scroller.scrollTop = panRef.current.st - (e.evt.clientY - panRef.current.y);
      }
      return;
    }
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    if (drawing) setDrawing([...drawing, pos.x / scale, pos.y / scale]);
    if (dragShape) setDragShape({ ...dragShape, x1: pos.x, y1: pos.y });
  }

  function onPointerUp() {
    panRef.current = null;
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
    if (dragShape) {
      const dx = Math.abs(dragShape.x1 - dragShape.x0);
      const dy = Math.abs(dragShape.y1 - dragShape.y0);
      if (dx > 4 || dy > 4) finishDragShape(dragShape.x0, dragShape.y0, dragShape.x1, dragShape.y1);
      setDragShape(null);
    }
  }

  const crop = page.cropMargin ?? 0;

  return (
    <div ref={wrapRef} className="ps-page-view" style={{ width: w, height: h }} data-page-id={page.id}>
      <canvas ref={canvasRef} className="pdf-layer" width={w} height={h} />
      {crop > 0 && (
        <div
          className="ps-crop-guide"
          style={{
            inset: crop * scale,
          }}
          aria-hidden
        />
      )}
      <div className="ps-overlay" style={{ cursor: tool === "pan" ? "grab" : tool === "select" ? "default" : "crosshair" }}>
        <Stage
          width={w}
          height={h}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
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
              <Line points={drawing.map((v) => v * scale)} stroke="#111" strokeWidth={2} tension={0.3} lineCap="round" />
            )}
            {dragShape && (
              <Rect
                x={Math.min(dragShape.x0, dragShape.x1)}
                y={Math.min(dragShape.y0, dragShape.y1)}
                width={Math.abs(dragShape.x1 - dragShape.x0)}
                height={Math.abs(dragShape.y1 - dragShape.y0)}
                stroke="#8b1a1a"
                dash={[6, 4]}
                fill="rgba(139,26,26,0.08)"
              />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}