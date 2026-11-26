import type { StudioMode } from "./constants";

export type ObjectType =
  | "text"
  | "image"
  | "highlight"
  | "underline"
  | "strikethrough"
  | "pen"
  | "rect"
  | "ellipse"
  | "line"
  | "arrow"
  | "check"
  | "cross"
  | "signature"
  | "whiteout"
  | "watermark";

export type EditObjectBase = {
  id: string;
  pageId: string;
  type: ObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
};

export type TextObject = EditObjectBase & {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
  backgroundColor: string | null;
  align: "left" | "center" | "right";
  lineHeight: number;
};

export type ImageObject = EditObjectBase & {
  type: "image" | "signature";
  /** data URL or object URL — revoked on cleanup */
  src: string;
  lockAspect: boolean;
};

export type ShapeObject = EditObjectBase & {
  type: "rect" | "ellipse" | "line" | "arrow" | "check" | "cross" | "whiteout" | "highlight" | "underline" | "strikethrough";
  fill: string;
  stroke: string;
  strokeWidth: number;
};

export type PenObject = EditObjectBase & {
  type: "pen";
  points: number[];
  stroke: string;
  strokeWidth: number;
};

export type WatermarkObject = EditObjectBase & {
  type: "watermark";
  text: string;
  fontSize: number;
  color: string;
  applyToAll: boolean;
};

export type EditObject = TextObject | ImageObject | ShapeObject | PenObject | WatermarkObject;

export type PageModel = {
  id: string;
  /** Stable source reference for export */
  sourceDocId: string;
  sourcePageIndex: number;
  width: number;
  height: number;
  rotation: 0 | 90 | 180 | 270;
  blank?: boolean;
  /** Uniform crop inset in PDF points; applied on export via crop box (does not erase hidden content). */
  cropMargin?: number;
};

export type SourceDoc = {
  id: string;
  name: string;
  /** Original bytes — do not clone unnecessarily */
  bytes: Uint8Array;
  pageCount: number;
  byteLength: number;
  encrypted: boolean;
};

export type FormFieldValue = {
  name: string;
  value: string | boolean | string[];
};

export type PageNumberSettings = {
  enabled: boolean;
  format: "n" | "page-n" | "page-n-of-m";
  prefix: string;
  suffix: string;
  start: number;
  position: "bottom-center" | "bottom-left" | "bottom-right" | "top-center";
  fontSize: number;
  color: string;
  margin: number;
};

export type ExportOptions = {
  flatten: boolean;
  filename: string;
};

export type EditorTool =
  | "select"
  | "pan"
  | "text"
  | "image"
  | "highlight"
  | "underline"
  | "strikethrough"
  | "pen"
  | "rect"
  | "ellipse"
  | "line"
  | "arrow"
  | "check"
  | "cross"
  | "signature"
  | "whiteout";

export type HistoryEntry = {
  label: string;
  undo: () => void;
  redo: () => void;
};

/** Serializable snapshot for coalesced history */
export type SessionSnapshot = {
  name: string;
  pageOrder: string[];
  pages: Record<string, PageModel>;
  objects: Record<string, EditObject>;
  formValues: FormFieldValue[];
  pageNumbers: PageNumberSettings;
};

export type DocumentSession = {
  id: string;
  name: string;
  mode: StudioMode;
  sources: Record<string, SourceDoc>;
  pages: Record<string, PageModel>;
  pageOrder: string[];
  objects: Record<string, EditObject>;
  formValues: FormFieldValue[];
  pageNumbers: PageNumberSettings;
  dirty: boolean;
  tool: EditorTool;
  selectedObjectIds: string[];
  selectedPageIds: string[];
  currentPageId: string | null;
  zoom: number;
  fitMode: "width" | "page" | "custom";
  viewMode: "continuous" | "single";
  snapGrid: boolean;
  processing: string | null;
  error: string | null;
};

export function newId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function defaultPageNumbers(): PageNumberSettings {
  return {
    enabled: false,
    format: "page-n-of-m",
    prefix: "",
    suffix: "",
    start: 1,
    position: "bottom-center",
    fontSize: 10,
    color: "#333333",
    margin: 28,
  };
}