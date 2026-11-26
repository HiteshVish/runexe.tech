import type { ReadinessItem, SpeedTestResult } from "./types";

function levelFrom(ok: boolean, fair: boolean): ReadinessItem["level"] {
  if (ok) return "Excellent";
  if (fair) return "Good";
  return "Fair";
}

export function computeReadiness(result: SpeedTestResult): ReadinessItem[] {
  const dl = result.downloadMbps;
  const ul = result.uploadMbps;
  const ping = result.pingMs;
  const jitter = result.jitterMs;
  const loaded =
    result.loadedDownloadLatencyMs != null && result.loadedUploadLatencyMs != null
      ? (result.loadedDownloadLatencyMs + result.loadedUploadLatencyMs) / 2
      : result.loadedDownloadLatencyMs ?? result.loadedUploadLatencyMs ?? ping;

  const streamOk = dl >= 25 && loaded < 100;
  const streamFair = dl >= 10;
  const gameOk = ping <= 40 && jitter <= 15 && loaded < 80;
  const gameFair = ping <= 80 && jitter <= 30;
  const callOk = ul >= 3 && ping <= 60 && jitter <= 20;
  const callFair = ul >= 1.5 && ping <= 120;

  return [
    {
      id: "stream",
      label: "4K / 8K Video Stream",
      level: levelFrom(streamOk, streamFair),
      detail: streamOk ? "Flawless (Instant Buffer)" : streamFair ? "Good" : "May buffer",
    },
    {
      id: "game",
      label: "Gaming Stability",
      level: levelFrom(gameOk, gameFair),
      detail: gameOk ? "Ultra Smooth" : gameFair ? "Playable" : "High latency",
    },
    {
      id: "voip",
      label: "Voice VoIP Calls",
      level: levelFrom(callOk, callFair),
      detail: callOk ? `Crystal (${jitter.toFixed(1)}ms Jitter)` : callFair ? "Acceptable" : "Unstable",
    },
  ];
}

export function readinessPct(level: ReadinessItem["level"]): number {
  switch (level) {
    case "Excellent":
      return 96;
    case "Good":
      return 78;
    case "Fair":
      return 55;
    default:
      return 32;
  }
}
