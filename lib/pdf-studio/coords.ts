/** Convert screen delta to PDF user-space units given viewport scale. */
export function screenToPdf(dx: number, dy: number, scale: number): { x: number; y: number } {
  return { x: dx / scale, y: dy / scale };
}

export function pdfToScreen(x: number, y: number, scale: number): { x: number; y: number } {
  return { x: x * scale, y: y * scale };
}

/**
 * PDF.js viewport uses top-left origin for canvas; pdf-lib uses bottom-left.
 * Convert overlay (top-left PDF space used in our model) to pdf-lib coords.
 * Our model stores y from top of page (like CSS).
 */
export function topLeftToPdfLib(
  x: number,
  y: number,
  width: number,
  height: number,
  pageHeight: number,
): { x: number; y: number; width: number; height: number } {
  return {
    x,
    y: pageHeight - y - height,
    width,
    height,
  };
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function snap(value: number, grid: number): number {
  if (grid <= 0) return value;
  return Math.round(value / grid) * grid;
}