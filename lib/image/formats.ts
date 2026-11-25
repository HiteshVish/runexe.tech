let webpEncodeCached: boolean | null = null;

/** Detect whether this browser can encode WebP via canvas.toBlob. */
export function detectWebpEncodeSupport(): Promise<boolean> {
  if (webpEncodeCached !== null) return Promise.resolve(webpEncodeCached);
  if (typeof document === "undefined") return Promise.resolve(false);
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    canvas.toBlob(
      (blob) => {
        webpEncodeCached = blob?.type === "image/webp";
        resolve(webpEncodeCached);
      },
      "image/webp",
      0.5,
    );
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function parseSizeInput(value: string, unit: "KB" | "MB"): number | null {
  const n = parseFloat(value.replace(/,/g, "").trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * (unit === "MB" ? 1024 * 1024 : 1024));
}

export function percentSaved(original: number, compressed: number): string {
  if (original <= 0) return "0%";
  const pct = Math.max(0, Math.round((1 - compressed / original) * 100));
  return `${pct}% smaller`;
}