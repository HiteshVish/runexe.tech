function graphemeFallback(text: string): string[] {
  return [...text];
}

export function countGraphemes(text: string): number {
  if (!text) return 0;
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return [...seg.segment(text)].length;
  }
  return graphemeFallback(text).length;
}

export function countWords(text: string): number {
  if (!text.trim()) return 0;
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "word" });
    let n = 0;
    for (const part of seg.segment(text)) {
      if (part.isWordLike) n++;
    }
    return n;
  }
  const matches = text.match(/[\p{L}\p{N}]+/gu);
  return matches?.length ?? 0;
}

export function countSentences(text: string): number {
  if (!text.trim()) return 0;
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "sentence" });
    return [...seg.segment(text)].filter((s) => s.segment.trim()).length;
  }
  const parts = text.split(/[.!?।]+/).filter((p) => p.trim());
  return parts.length || (text.trim() ? 1 : 0);
}