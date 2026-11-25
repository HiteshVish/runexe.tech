import { EN_STOPWORDS } from "./stopwords";

export type KeywordRow = { word: string; count: number; percent: number };

export function topKeywords(
  text: string,
  opts: { ignoreStopwords: boolean; minLength: number },
  limit = 10,
): KeywordRow[] {
  const tokens = text.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? [];
  const counts = new Map<string, number>();
  let total = 0;
  for (const raw of tokens) {
    const w = raw.replace(/^'|'$/g, "");
    if (w.length < opts.minLength) continue;
    if (opts.ignoreStopwords && EN_STOPWORDS.has(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
    total++;
  }
  if (!total) return [];
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({
      word,
      count,
      percent: (count / total) * 100,
    }));
}