export function toUpper(text: string): string {
  return text.toUpperCase();
}

export function toLower(text: string): string {
  return text.toLowerCase();
}

export function toTitleCase(text: string): string {
  return text.replace(/[\p{L}\p{N}]+/gu, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

export function toSentenceCase(text: string): string {
  const lower = text.toLowerCase();
  return lower.replace(/(^\s*|[.!?]\s+)([\p{L}])/gu, (_, pre, c) => pre + c.toUpperCase());
}

export function collapseWhitespace(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}