export const COMPRESS_TARGET_SLUGS = ["20kb", "50kb", "100kb", "200kb", "500kb", "1mb"] as const;

export type CompressTargetSlug = (typeof COMPRESS_TARGET_SLUGS)[number];

export const TARGET_BYTES: Record<CompressTargetSlug, number> = {
  "20kb": 20 * 1024,
  "50kb": 50 * 1024,
  "100kb": 100 * 1024,
  "200kb": 200 * 1024,
  "500kb": 500 * 1024,
  "1mb": 1024 * 1024,
};

export const TARGET_LABELS: Record<CompressTargetSlug, string> = {
  "20kb": "20 KB",
  "50kb": "50 KB",
  "100kb": "100 KB",
  "200kb": "200 KB",
  "500kb": "500 KB",
  "1mb": "1 MB",
};

export function isCompressTargetSlug(s: string): s is CompressTargetSlug {
  return (COMPRESS_TARGET_SLUGS as readonly string[]).includes(s);
}

export function landingMeta(slug: CompressTargetSlug) {
  const label = TARGET_LABELS[slug];
  return {
    title: `Compress Image to ${label} Online – Free, No Upload | RunExe`,
    description: `Shrink JPG, PNG or WebP photos to about ${label} in your browser. Nothing is uploaded. Free image compressor by RunExe Technology.`,
    h1: `Compress image to ${label}`,
    lead: `Upload a photo and compress it to roughly ${label}. Runs in your browser — nothing is uploaded to a server.`,
    path: `/tools/compress-image-to/${slug}` as const,
  };
}