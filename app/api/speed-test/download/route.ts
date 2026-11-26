import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

const DEFAULT_BYTES = 10_000_000;
const MAX_BYTES = 25_000_000;
const CHUNK = randomBytes(65_536);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = Number(url.searchParams.get("bytes") ?? DEFAULT_BYTES);
  const total = Number.isFinite(raw) ? Math.min(MAX_BYTES, Math.max(1, Math.floor(raw))) : DEFAULT_BYTES;

  let sent = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (sent >= total) {
        controller.close();
        return;
      }
      const remaining = total - sent;
      const slice = remaining >= CHUNK.length ? CHUNK : CHUNK.subarray(0, remaining);
      controller.enqueue(slice);
      sent += slice.length;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Encoding": "identity",
      "Content-Length": String(total),
    },
  });
}
