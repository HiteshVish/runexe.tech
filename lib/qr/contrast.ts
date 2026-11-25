const MIN_SCAN_RATIO = 4.5;

function expandHex(h: string): string | null {
  const hex = h.replace("#", "").trim();
  if (hex.length === 3) return hex.split("").map((c) => c + c).join("");
  if (hex.length === 6) return hex;
  return null;
}

export function normalizeHex(color: string, fallback = "#000000"): string {
  const full = expandHex(color);
  if (!full || !/^[0-9a-fA-F]{6}$/.test(full)) return fallback;
  return `#${full.toLowerCase()}`;
}

function luminance(hex: string): number {
  const full = expandHex(hex);
  if (!full) return 0;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(fg: string, bg: string): number {
  const L1 = luminance(normalizeHex(fg));
  const L2 = luminance(normalizeHex(bg));
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function mixHex(a: string, b: string, t: number): string {
  const parse = (h: string) => {
    const f = expandHex(h) ?? "000000";
    return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
  };
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const ch = (x: number, y: number) => Math.round(x + (y - x) * t);
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex(ch(r1, r2))}${hex(ch(g1, g2))}${hex(ch(b1, b2))}`;
}

/**
 * QR modules must be darker than the quiet zone. Nudge colors toward scannable contrast
 * while keeping the user’s hues as much as possible.
 */
export function prepareScanColors(
  fg: string,
  bg: string,
): { fg: string; bg: string; adjusted: boolean; ratio: number } {
  let fgN = normalizeHex(fg, "#000000");
  let bgN = normalizeHex(bg, "#ffffff");
  let adjusted = false;

  if (luminance(fgN) > luminance(bgN)) {
    const tmp = fgN;
    fgN = bgN;
    bgN = tmp;
    adjusted = true;
  }

  let ratio = contrastRatio(fgN, bgN);
  let guard = 0;
  while (ratio < MIN_SCAN_RATIO && guard < 24) {
    fgN = mixHex(fgN, "#000000", 0.12);
    bgN = mixHex(bgN, "#ffffff", 0.1);
    adjusted = true;
    ratio = contrastRatio(fgN, bgN);
    guard++;
  }

  return { fg: fgN, bg: bgN, adjusted, ratio };
}

export function contrastWarnings(fg: string, bg: string): string[] {
  const warnings: string[] = [];
  const fgN = normalizeHex(fg);
  const bgN = normalizeHex(bg);
  const ratio = contrastRatio(fgN, bgN);
  const prepared = prepareScanColors(fg, bg);

  if (luminance(fgN) > luminance(bgN)) {
    warnings.push("QR modules should be darker than the background. We flip and adjust colors when rendering.");
  }
  if (ratio < MIN_SCAN_RATIO) {
    warnings.push(
      `Contrast is low (${ratio.toFixed(1)}:1). The preview uses scan-safe colors (${prepared.ratio.toFixed(1)}:1) so phones can read it reliably.`,
    );
  }
  if (prepared.adjusted && ratio >= MIN_SCAN_RATIO) {
    /* user colors already ok */
  }
  return warnings;
}

export function isScannableWithoutAdjust(fg: string, bg: string): boolean {
  const fgN = normalizeHex(fg);
  const bgN = normalizeHex(bg);
  return luminance(fgN) < luminance(bgN) && contrastRatio(fgN, bgN) >= MIN_SCAN_RATIO;
}