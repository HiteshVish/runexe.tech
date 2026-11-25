export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_SAFE_EDGE = 4096;

export const INPUT_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const UNSUPPORTED_MIME_HINT = "image/gif";

export type OutputFormat = "jpeg" | "png" | "webp";

export const OUTPUT_MIME: Record<OutputFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export const OUTPUT_EXT: Record<OutputFormat, string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
};

export type FitMode = "contain" | "cover";

export type ResizePreset = { label: string; width: number; height: number };

export const RESIZE_PRESETS: ResizePreset[] = [
  { label: "200×200", width: 200, height: 200 },
  { label: "300×300", width: 300, height: 300 },
  { label: "512×512", width: 512, height: 512 },
  { label: "800×600", width: 800, height: 600 },
  { label: "1080×1080", width: 1080, height: 1080 },
  { label: "1920×1080", width: 1920, height: 1080 },
  { label: "Passport (413×531)", width: 413, height: 531 },
];

export const TARGET_SIZE_PRESET_BYTES = [
  20 * 1024,
  50 * 1024,
  100 * 1024,
  200 * 1024,
  500 * 1024,
  1024 * 1024,
] as const;