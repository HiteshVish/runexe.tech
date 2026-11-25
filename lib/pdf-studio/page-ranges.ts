/**
 * Parse page range strings like "1-3, 5, 8-10" (1-based, inclusive).
 * Returns sorted unique 0-based indices, or an error.
 */
export function parsePageRanges(
  input: string,
  pageCount: number,
): { ok: true; indices: number[] } | { ok: false; error: string } {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Enter at least one page or range." };
  if (pageCount < 1) return { ok: false, error: "Document has no pages." };

  const set = new Set<number>();
  const parts = trimmed.split(/[,;\s]+/).filter(Boolean);

  for (const part of parts) {
    const m = /^(\d+)(?:\s*[-–—]\s*(\d+))?$/.exec(part);
    if (!m) return { ok: false, error: `Invalid range: "${part}".` };
    let a = parseInt(m[1], 10);
    let b = m[2] ? parseInt(m[2], 10) : a;
    if (a < 1 || b < 1) return { ok: false, error: "Page numbers start at 1." };
    if (a > pageCount || b > pageCount) {
      return { ok: false, error: `Page out of range (document has ${pageCount} pages).` };
    }
    if (a > b) [a, b] = [b, a];
    for (let i = a; i <= b; i++) set.add(i - 1);
  }

  const indices = [...set].sort((x, y) => x - y);
  if (!indices.length) return { ok: false, error: "No pages selected." };
  return { ok: true, indices };
}

/** Split into groups of every N pages (0-based indices arrays). */
export function splitEveryN(pageCount: number, n: number): number[][] {
  if (n < 1 || pageCount < 1) return [];
  const groups: number[][] = [];
  for (let i = 0; i < pageCount; i += n) {
    const g: number[] = [];
    for (let j = i; j < Math.min(i + n, pageCount); j++) g.push(j);
    groups.push(g);
  }
  return groups;
}

export function splitEveryPage(pageCount: number): number[][] {
  return Array.from({ length: pageCount }, (_, i) => [i]);
}