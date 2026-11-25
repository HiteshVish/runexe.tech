/** Soft limit — warn above this; hard reject above MAX. */
export const WARN_FILE_BYTES = 40 * 1024 * 1024;
export const MAX_FILE_BYTES = 80 * 1024 * 1024;
export const MAX_PAGES = 500;
export const MAX_MERGE_FILES = 40;

export const PAGE_SIZES = {
  A4: { width: 595.28, height: 841.89 },
  A3: { width: 841.89, height: 1190.55 },
  Letter: { width: 612, height: 792 },
  Legal: { width: 612, height: 1008 },
} as const;

export type PageSizeName = keyof typeof PAGE_SIZES;

export const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // %PDF

export type StudioMode =
  | "editor"
  | "merge"
  | "split"
  | "organize"
  | "rotate"
  | "remove-pages"
  | "sign"
  | "add-text"
  | "watermark"
  | "compress"
  | "pdf-to-image"
  | "image-to-pdf"
  | "crop"
  | "metadata";

export const DEFAULT_FONT = "Helvetica";
export const FONT_CHOICES = [
  "Helvetica",
  "Helvetica-Bold",
  "Times-Roman",
  "Times-Bold",
  "Courier",
  "Courier-Bold",
] as const;