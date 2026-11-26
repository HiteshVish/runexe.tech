import type { BufferbloatGrade, EngineCallbacks, EngineProgress, SpeedSample, SpeedTestResult, TestPhase } from "./types";

const PING_URL = "/api/speed-test/ping";
const DOWNLOAD_URL = "/api/speed-test/download";
const UPLOAD_URL = "/api/speed-test/upload";

const DOWNLOAD_SECONDS = 8;
const UPLOAD_SECONDS = 8;
const DOWNLOAD_RAMP_MS = 1200;
const DOWNLOAD_PARALLEL = 4;
const UPLOAD_PARALLEL = 3;
const UPLOAD_CHUNK = 2 * 1024 * 1024;
const DOWNLOAD_BYTES = 15_000_000;
const SAMPLE_MS = 100;

function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function meanAbsDiff(values: number[]): number {
  if (values.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < values.length; i++) sum += Math.abs(values[i] - values[i - 1]);
  return sum / (values.length - 1);
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function gradeBufferbloat(idleMs: number, loadedMs: number | null): BufferbloatGrade {
  if (loadedMs == null || !Number.isFinite(loadedMs)) return "B";
  const delta = Math.max(0, loadedMs - idleMs);
  if (delta < 20) return "A+";
  if (delta < 50) return "A";
  if (delta < 100) return "B";
  if (delta < 200) return "C";
  if (delta < 400) return "D";
  return "F";
}

function bytesToMbps(bytes: number, ms: number): number {
  if (ms <= 0) return 0;
  return (bytes * 8) / (ms / 1000) / 1_000_000;
}

function randomPayload(size: number): Uint8Array {
  const buf = new Uint8Array(size);
  const cryptoObj = typeof crypto !== "undefined" ? crypto : null;
  if (cryptoObj?.getRandomValues) {
    for (let offset = 0; offset < size; offset += 65536) {
      cryptoObj.getRandomValues(buf.subarray(offset, Math.min(offset + 65536, size)));
    }
  } else {
    for (let i = 0; i < size; i++) buf[i] = (Math.random() * 256) | 0;
  }
  return buf;
}

export class SpeedTestEngine {
  private abort: AbortController | null = null;
  private xhrs: XMLHttpRequest[] = [];
  private running = false;

  constructor(private readonly cb: EngineCallbacks) {}

  get isRunning() {
    return this.running;
  }

  stop() {
    this.running = false;
    this.abort?.abort();
    this.abort = null;
    for (const xhr of this.xhrs) {
      try {
        xhr.abort();
      } catch {
        /* ignore */
      }
    }
    this.xhrs = [];
  }

  dispose() {
    this.stop();
  }

  async start() {
    this.stop();
    this.running = true;
    this.abort = new AbortController();
    const signal = this.abort.signal;
    const samples: SpeedSample[] = [];
    const partial: Partial<SpeedTestResult> = {};
    let liveMbps = 0;
    let totalBytes = 0;

    const emit = (phase: TestPhase) => {
      this.cb.onProgress({ phase, liveMbps, samples: [...samples], partial: { ...partial } });
    };

    try {
      emit("ping");
      const pings = await this.measurePings(signal);
      partial.pingMs = Math.min(...pings);
      partial.pingMedianMs = median(pings);
      partial.jitterMs = meanAbsDiff(pings);
      emit("ping");

      emit("download");
      const dl = await this.measureDownload(signal, samples, (mbps) => {
        liveMbps = mbps;
        emit("download");
      });
      partial.downloadMbps = dl.avg;
      partial.downloadPeakMbps = dl.peak;
      partial.loadedDownloadLatencyMs = dl.loadedLatency;
      totalBytes += dl.bytes;
      liveMbps = dl.avg;
      emit("download");

      emit("upload");
      const ul = await this.measureUpload(signal, samples, (mbps) => {
        liveMbps = mbps;
        emit("upload");
      });
      partial.uploadMbps = ul.avg;
      partial.uploadPeakMbps = ul.peak;
      partial.loadedUploadLatencyMs = ul.loadedLatency;
      totalBytes += ul.bytes;
      liveMbps = ul.avg;
      emit("upload");

      if (!this.running || signal.aborted) return;

      const dlSamples = samples.filter((s) => s.phase === "download").map((s) => s.mbps);
      const ulSamples = samples.filter((s) => s.phase === "upload").map((s) => s.mbps);
      const all = [...dlSamples, ...ulSamples];
      const mean = all.length ? all.reduce((a, b) => a + b, 0) / all.length : 0;
      const stability = mean > 0 ? Math.max(0, Math.min(100, 100 - (stdDev(all) / mean) * 100)) : 0;

      const result: SpeedTestResult = {
        id: `st_${Date.now().toString(36)}`,
        timestamp: Date.now(),
        downloadMbps: partial.downloadMbps ?? 0,
        uploadMbps: partial.uploadMbps ?? 0,
        downloadPeakMbps: partial.downloadPeakMbps ?? 0,
        uploadPeakMbps: partial.uploadPeakMbps ?? 0,
        pingMs: partial.pingMs ?? 0,
        pingMedianMs: partial.pingMedianMs ?? 0,
        jitterMs: partial.jitterMs ?? 0,
        loadedDownloadLatencyMs: partial.loadedDownloadLatencyMs ?? null,
        loadedUploadLatencyMs: partial.loadedUploadLatencyMs ?? null,
        bufferbloatGrade: gradeBufferbloat(
          partial.pingMedianMs ?? 0,
          Math.max(partial.loadedDownloadLatencyMs ?? 0, partial.loadedUploadLatencyMs ?? 0) || null,
        ),
        stabilityPct: stability,
        totalTransferredMb: totalBytes / (1024 * 1024),
      };

      this.running = false;
      this.cb.onProgress({
        phase: "complete",
        liveMbps: result.downloadMbps,
        samples,
        partial: result,
      });
      this.cb.onComplete(result);
    } catch (err) {
      this.running = false;
      if (signal.aborted) return;
      const message = err instanceof Error ? err.message : "Speed test failed.";
      this.cb.onError(message);
    }
  }

  private async measurePings(signal: AbortSignal): Promise<number[]> {
    const results: number[] = [];
    for (let i = 0; i < 10; i++) {
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      const t0 = performance.now();
      const res = await fetch(`${PING_URL}?n=${i}&r=${Math.random()}`, {
        cache: "no-store",
        signal,
      });
      await res.arrayBuffer();
      const dt = performance.now() - t0;
      if (i > 0) results.push(dt);
    }
    return results.length ? results : [0];
  }

  private async pingOnce(signal: AbortSignal): Promise<number> {
    const t0 = performance.now();
    const res = await fetch(`${PING_URL}?loaded=1&r=${Math.random()}`, { cache: "no-store", signal });
    await res.arrayBuffer();
    return performance.now() - t0;
  }

  private async measureDownload(
    signal: AbortSignal,
    samples: SpeedSample[],
    onLive: (mbps: number) => void,
  ): Promise<{ avg: number; peak: number; bytes: number; loadedLatency: number | null }> {
    const start = performance.now();
    let bytes = 0;
    let peak = 0;
    const loaded: number[] = [];
    let lastSampleAt = start;
    let lastSampleBytes = 0;
    let settledBytes = 0;
    let settledStart = 0;

    const pingLoop = (async () => {
      while (!signal.aborted && performance.now() - start < DOWNLOAD_SECONDS * 1000) {
        try {
          loaded.push(await this.pingOnce(signal));
        } catch {
          break;
        }
        await new Promise((r) => setTimeout(r, 400));
      }
    })();

    const streamOne = async () => {
      while (!signal.aborted && performance.now() - start < DOWNLOAD_SECONDS * 1000) {
        const res = await fetch(`${DOWNLOAD_URL}?bytes=${DOWNLOAD_BYTES}&r=${Math.random()}`, {
          cache: "no-store",
          signal,
        });
        if (!res.body) throw new Error("Download stream unavailable.");
        const reader = res.body.getReader();
        for (;;) {
          if (signal.aborted || performance.now() - start >= DOWNLOAD_SECONDS * 1000) {
            try {
              await reader.cancel();
            } catch {
              /* ignore */
            }
            break;
          }
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;
          bytes += value.byteLength;
          const now = performance.now();
          const elapsed = now - start;
          if (elapsed >= DOWNLOAD_RAMP_MS && settledStart === 0) {
            settledStart = now;
            settledBytes = bytes;
          }
          if (now - lastSampleAt >= SAMPLE_MS) {
            const dt = now - lastSampleAt;
            const db = bytes - lastSampleBytes;
            const mbps = bytesToMbps(db, dt);
            peak = Math.max(peak, mbps);
            samples.push({ t: now - start, mbps, phase: "download" });
            onLive(mbps);
            lastSampleAt = now;
            lastSampleBytes = bytes;
          }
        }
      }
    };

    await Promise.all(Array.from({ length: DOWNLOAD_PARALLEL }, () => streamOne()));
    await pingLoop.catch(() => {});

    const end = performance.now();
    const settledMs = Math.max(1, end - (settledStart || start + DOWNLOAD_RAMP_MS));
    const settled = Math.max(0, bytes - settledBytes);
    const avg = bytesToMbps(settled, settledMs);
    return {
      avg,
      peak: Math.max(peak, avg),
      bytes,
      loadedLatency: loaded.length ? median(loaded) : null,
    };
  }

  private uploadChunk(payload: Uint8Array, signal: AbortSignal): Promise<{ bytes: number; ms: number }> {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      const xhr = new XMLHttpRequest();
      this.xhrs.push(xhr);
      const t0 = performance.now();
      let lastLoaded = 0;

      const cleanup = () => {
        this.xhrs = this.xhrs.filter((x) => x !== xhr);
        signal.removeEventListener("abort", onAbort);
      };
      const onAbort = () => {
        xhr.abort();
        cleanup();
        reject(new DOMException("Aborted", "AbortError"));
      };
      signal.addEventListener("abort", onAbort);

      xhr.open("POST", UPLOAD_URL, true);
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
      xhr.responseType = "json";
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) lastLoaded = ev.loaded;
      };
      xhr.onload = () => {
        cleanup();
        const received =
          typeof xhr.response?.receivedBytes === "number" ? xhr.response.receivedBytes : lastLoaded || payload.byteLength;
        resolve({ bytes: received, ms: performance.now() - t0 });
      };
      xhr.onerror = () => {
        cleanup();
        reject(new Error("Upload failed."));
      };
      xhr.onabort = () => {
        cleanup();
        reject(new DOMException("Aborted", "AbortError"));
      };
      xhr.send(payload.buffer.slice(payload.byteOffset, payload.byteOffset + payload.byteLength) as ArrayBuffer);
    });
  }

  private async measureUpload(
    signal: AbortSignal,
    samples: SpeedSample[],
    onLive: (mbps: number) => void,
  ): Promise<{ avg: number; peak: number; bytes: number; loadedLatency: number | null }> {
    const start = performance.now();
    let bytes = 0;
    let peak = 0;
    const loaded: number[] = [];
    const payload = randomPayload(UPLOAD_CHUNK);
    let lastSampleAt = start;
    let lastSampleBytes = 0;

    const pingLoop = (async () => {
      while (!signal.aborted && performance.now() - start < UPLOAD_SECONDS * 1000) {
        try {
          loaded.push(await this.pingOnce(signal));
        } catch {
          break;
        }
        await new Promise((r) => setTimeout(r, 400));
      }
    })();

    const worker = async () => {
      while (!signal.aborted && performance.now() - start < UPLOAD_SECONDS * 1000) {
        try {
          const { bytes: n } = await this.uploadChunk(payload, signal);
          bytes += n;
          const now = performance.now();
          if (now - lastSampleAt >= SAMPLE_MS) {
            const dt = now - lastSampleAt;
            const db = bytes - lastSampleBytes;
            const mbps = bytesToMbps(db, dt);
            peak = Math.max(peak, mbps);
            samples.push({ t: now - start, mbps, phase: "upload" });
            onLive(mbps);
            lastSampleAt = now;
            lastSampleBytes = bytes;
          }
        } catch (err) {
          if (signal.aborted) break;
          throw err;
        }
      }
    };

    await Promise.all(Array.from({ length: UPLOAD_PARALLEL }, () => worker()));
    await pingLoop.catch(() => {});

    const elapsed = Math.max(1, performance.now() - start);
    const avg = bytesToMbps(bytes, elapsed);
    return {
      avg,
      peak: Math.max(peak, avg),
      bytes,
      loadedLatency: loaded.length ? median(loaded) : null,
    };
  }
}

export function formatMbps(n: number, digits = 1): string {
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (n >= 100) return n.toFixed(0);
  if (n >= 10) return n.toFixed(1);
  return n.toFixed(digits);
}

export function mbpsToMBps(mbps: number): number {
  return mbps / 8;
}
