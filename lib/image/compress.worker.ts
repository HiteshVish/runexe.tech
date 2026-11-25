// @ts-nocheck
/**
 * Optional worker entry: encodes a blob via OffscreenCanvas when available.
 * Fallback is main-thread processing in ImageCompressorApp.
 */

import type { OutputFormat } from "./constants";
import { OUTPUT_MIME } from "./constants";

export type WorkerEncodeRequest = {
  type: "encode";
  imageData: ImageData;
  width: number;
  height: number;
  mime: string;
  quality: number;
};

export type WorkerEncodeResponse =
  | { type: "done"; buffer: ArrayBuffer; mime: string }
  | { type: "error"; message: string };

self.onmessage = async (ev: MessageEvent<WorkerEncodeRequest>) => {
  const msg = ev.data;
  if (msg?.type !== "encode") return;
  try {
    const canvas = new OffscreenCanvas(msg.width, msg.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("OffscreenCanvas unavailable");
    ctx.putImageData(msg.imageData, 0, 0);
    const blob = await canvas.convertToBlob({
      type: msg.mime,
      quality: msg.mime === OUTPUT_MIME.png ? undefined : msg.quality,
    });
    const buffer = await blob.arrayBuffer();
    const res: WorkerEncodeResponse = { type: "done", buffer, mime: blob.type };
    self.postMessage(res, { transfer: [buffer] });
  } catch (e) {
    const res: WorkerEncodeResponse = {
      type: "error",
      message: e instanceof Error ? e.message : "Worker encode failed",
    };
    self.postMessage(res);
  }
};

export function formatForWorker(fmt: OutputFormat): string {
  return OUTPUT_MIME[fmt];
}