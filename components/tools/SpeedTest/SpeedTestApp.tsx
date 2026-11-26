"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SpeedTestEngine } from "@/lib/speed-test/engine";
import type {
  ConnectionInfo,
  EngineProgress,
  SpeedSample,
  SpeedTestResult,
  TestPhase,
} from "@/lib/speed-test/types";
import DiagnosticsPanel from "./DiagnosticsPanel";
import MetricGrid from "./MetricGrid";
import RadialGauge from "./RadialGauge";
import WaveformPanel from "./WaveformPanel";
import "@/styles/speed-test.css";

type Mode = "single" | "multi" | "buffer" | "stress";

const MODES: { id: Mode; label: string }[] = [
  { id: "single", label: "SINGLE THREAD" },
  { id: "multi", label: "MULTI-STREAM (DEFAULT)" },
  { id: "buffer", label: "BUFFERBLOAT SCAN" },
  { id: "stress", label: "STRESS BURST" },
];

function phaseProgress(phase: TestPhase, running: boolean): number {
  if (phase === "complete") return 100;
  if (!running) return 0;
  switch (phase) {
    case "ping":
      return 12;
    case "download":
      return 48;
    case "upload":
      return 82;
    default:
      return 4;
  }
}

export default function SpeedTestApp() {
  const [phase, setPhase] = useState<TestPhase>("idle");
  const [running, setRunning] = useState(false);
  const [liveMbps, setLiveMbps] = useState(0);
  const [samples, setSamples] = useState<SpeedSample[]>([]);
  const [partial, setPartial] = useState<Partial<SpeedTestResult> | null>(null);
  const [result, setResult] = useState<SpeedTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<ConnectionInfo | null>(null);
  const [mode, setMode] = useState<Mode>("multi");
  const [dlFloor, setDlFloor] = useState<number | null>(null);
  const [ulFloor, setUlFloor] = useState<number | null>(null);
  const engineRef = useRef<SpeedTestEngine | null>(null);
  const runningRef = useRef(false);
  const toggleRef = useRef<() => void>(() => {});
  const startRef = useRef<() => void>(() => {});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/speed-test/info", { cache: "no-store" });
        if (!res.ok) throw new Error("info failed");
        const data = (await res.json()) as ConnectionInfo;
        if (!cancelled) setInfo(data);
      } catch {
        if (!cancelled) {
          setInfo({
            ip: "127.0.0.1",
            isp: "Local Network",
            asn: null,
            city: null,
            region: null,
            country: null,
            location: "Local Network",
            serverNode: "runexe.tech",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  const onProgress = useCallback((p: EngineProgress) => {
    setPhase(p.phase);
    setLiveMbps(p.liveMbps);
    setSamples(p.samples);
    setPartial(p.partial);
    if (p.phase === "download" && p.liveMbps > 0) {
      setDlFloor((prev) => (prev == null ? p.liveMbps : Math.min(prev, p.liveMbps)));
    }
    if (p.phase === "upload" && p.liveMbps > 0) {
      setUlFloor((prev) => (prev == null ? p.liveMbps : Math.min(prev, p.liveMbps)));
    }
  }, []);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    engineRef.current = null;
    runningRef.current = false;
    setRunning(false);
    setPhase((p) => (p === "complete" ? p : "idle"));
  }, []);

  const start = useCallback(() => {
    setError(null);
    setResult(null);
    setPartial(null);
    setSamples([]);
    setLiveMbps(0);
    setDlFloor(null);
    setUlFloor(null);
    runningRef.current = true;
    setRunning(true);
    setPhase("ping");

    const engine = new SpeedTestEngine({
      onProgress,
      onComplete: (r) => {
        setResult(r);
        setPartial(r);
        setLiveMbps(r.downloadMbps);
        setPhase("complete");
        runningRef.current = false;
        setRunning(false);
        engineRef.current = null;
      },
      onError: (message) => {
        setError(message);
        runningRef.current = false;
        setRunning(false);
        setPhase("idle");
        engineRef.current = null;
      },
    });
    engineRef.current = engine;
    void engine.start();
  }, [onProgress]);

  const toggle = useCallback(() => {
    if (runningRef.current) stop();
    else start();
  }, [start, stop]);

  const reset = useCallback(() => {
    if (runningRef.current) {
      engineRef.current?.stop();
      engineRef.current = null;
      runningRef.current = false;
      setRunning(false);
    }
    window.setTimeout(() => startRef.current(), 40);
  }, []);

  toggleRef.current = toggle;
  startRef.current = start;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code !== "Space" && e.key !== " ") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) {
        return;
      }
      e.preventDefault();
      toggleRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => startRef.current(), 360);
    return () => window.clearTimeout(id);
  }, []);

  const data = partial ?? result;
  const downloadMbps =
    phase === "download"
      ? liveMbps
      : phase === "upload"
        ? (partial?.downloadMbps ?? 0)
        : (result?.downloadMbps ?? liveMbps);
  const uploadMbps = phase === "upload" ? liveMbps : (data?.uploadMbps ?? null);
  const downloadPeak = Math.max(data?.downloadPeakMbps ?? 0, phase === "download" ? liveMbps : 0);
  const uploadPeak = Math.max(data?.uploadPeakMbps ?? 0, phase === "upload" ? liveMbps : 0);
  const heroValue = phase === "upload" ? liveMbps : downloadMbps;
  const heroPeak = phase === "upload" ? uploadPeak : downloadPeak;
  const progress = phaseProgress(phase, running);
  const pingLabel =
    data?.pingMs != null ? `${Math.round(data.pingMs)}ms` : "—";
  const edgeLabel = `RunExe edge · ${info?.serverNode || "runexe.tech"} · ${pingLabel}`;

  return (
    <div className="dt-page tool-page st-page">
      <div className="st-shell">
        <div className="st-aurora" aria-hidden />

        <header className="st-intro">
          <div className="st-badge-row">
            <span className="st-live-dot" />
            <span>Free tool</span>
            <span className="st-badge-sep">•</span>
            <span className="st-badge-accent">Server-assisted</span>
          </div>
          <h1 className="st-title">Internet Speed Test</h1>
          <p className="st-lead">
            Measure download, upload, latency and bufferbloat against RunExe servers. No signup
            required.
          </p>
          <div className="st-modes" role="tablist" aria-label="Test mode">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={mode === m.id}
                className={`st-mode${mode === m.id ? " is-on" : ""}`}
                onClick={() => setMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </header>

        <RadialGauge
          valueMbps={heroValue}
          peakMbps={heroPeak}
          phase={phase}
          running={running}
          progress={progress}
          edgeLabel={edgeLabel}
          onToggle={toggle}
          onReset={reset}
        />

        <WaveformPanel samples={samples} active={running} />

        <MetricGrid
          phase={phase}
          running={running}
          downloadMbps={downloadMbps}
          uploadMbps={uploadMbps}
          downloadPeak={downloadPeak}
          uploadPeak={uploadPeak}
          downloadFloor={dlFloor}
          uploadFloor={ulFloor}
          data={data}
          info={info}
        />

        <DiagnosticsPanel result={result} info={info} onRescan={reset} />

        <footer className="st-foot">
          <div className="st-foot-left">
            <span className="st-foot-dot" />
            <span className="st-foot-pop">RUNEXE POP: {info?.serverNode || "runexe.tech"}</span>
            <span className="st-foot-meta">PORT: 443 • HTTPS • MULTI-STREAM</span>
          </div>
          <div className="st-foot-right">
            <span className="st-foot-id-label">DIAGNOSTIC ID:</span>
            <span className="st-foot-id">{result?.id ? result.id.slice(0, 14).toUpperCase() : "RX-WAITING"}</span>
          </div>
        </footer>

        {error && (
          <p className="st-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
