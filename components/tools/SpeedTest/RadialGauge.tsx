"use client";

import { useEffect, useState } from "react";
import type { TestPhase } from "@/lib/speed-test/types";

type Props = {
  valueMbps: number;
  peakMbps: number;
  phase: TestPhase;
  running: boolean;
  progress: number;
  edgeLabel: string;
  onToggle: () => void;
  onReset: () => void;
};

const CYAN_C = 2 * Math.PI * 150;
const CRIMSON_C = 2 * Math.PI * 136;

function formatSpeed(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (n < 10) return n.toFixed(1);
  if (n < 100) return n.toFixed(1);
  return Math.round(n).toString();
}

function phaseLabel(phase: TestPhase, running: boolean): string {
  if (!running && phase === "complete") return "TEST COMPLETE";
  if (!running && phase === "idle") return "READY TO MEASURE";
  if (phase === "ping") return "MEASURING LATENCY…";
  if (phase === "download") return "MEASURING DOWNLOAD…";
  if (phase === "upload") return "MEASURING UPLOAD…";
  return "READY TO MEASURE";
}

export default function RadialGauge({
  valueMbps,
  peakMbps,
  phase,
  running,
  progress,
  edgeLabel,
  onToggle,
  onReset,
}: Props) {
  const [smooth, setSmooth] = useState(0);
  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reduced) {
      setSmooth(valueMbps);
      return;
    }
    let raf = 0;
    let current = smooth;
    const tick = () => {
      current += (valueMbps - current) * 0.18;
      if (Math.abs(current - valueMbps) < 0.05) {
        setSmooth(valueMbps);
        return;
      }
      setSmooth(current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueMbps, reduced]);

  const scale = Math.max(100, Math.ceil((Math.max(smooth, peakMbps) || 1) / 100) * 100);
  const cyanOffset = CYAN_C * (1 - Math.min(1, smooth / scale));
  const crimsonOffset = CRIMSON_C * (1 - Math.min(1, (peakMbps || smooth) / scale) * 0.85);

  return (
    <div className="st-gauge">
      <div className="st-gauge-frame">
        <svg className="st-gauge-rings" viewBox="0 0 360 360" aria-hidden>
          <circle className="st-ring-dash" cx="180" cy="180" r="150" fill="none" />
          <circle className="st-ring-outer" cx="180" cy="180" r="162" fill="none" />
          <circle
            className="st-ring-cyan"
            cx="180"
            cy="180"
            r="150"
            fill="none"
            strokeDasharray={CYAN_C}
            strokeDashoffset={cyanOffset}
            transform="rotate(-90 180 180)"
          />
          <circle
            className="st-ring-crimson"
            cx="180"
            cy="180"
            r="136"
            fill="none"
            strokeDasharray={CRIMSON_C}
            strokeDashoffset={crimsonOffset}
            transform="rotate(-90 180 180)"
          />
          <circle className="st-ring-inner" cx="180" cy="180" r="120" fill="none" />
        </svg>

        <div className="st-gauge-core">
          <div className="st-phase-row">
            <span className={`st-phase-dot${running ? " is-on" : ""}`} />
            <span className="st-phase-label">{phaseLabel(phase, running)}</span>
          </div>
          <div className="st-speed-row" aria-live="polite">
            <span className="st-speed-value">{formatSpeed(smooth)}</span>
            <span className="st-speed-unit">Mbps</span>
          </div>
          <div className="st-burst-row">
            <span className="st-burst-k">BURST PEAK</span>
            <span className="st-burst-v">
              {peakMbps > 0 ? `${peakMbps < 100 ? peakMbps.toFixed(1) : Math.round(peakMbps)} Mbps` : "—"}
            </span>
            <span className="st-burst-sep">•</span>
            <span className="st-burst-pct">{Math.round(progress)}%</span>
          </div>
          <div className="st-gauge-actions">
            <button
              type="button"
              className="st-icon-btn"
              onClick={onToggle}
              aria-label={running ? "Stop test" : phase === "complete" ? "Run again" : "Start test"}
              title={running ? "Pause / Stop" : "Start"}
            >
              {running ? (
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                  <path fill="currentColor" d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                  <path fill="currentColor" d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button type="button" className="st-icon-btn" onClick={onReset} aria-label="Restart test" title="Restart">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                <path
                  fill="currentColor"
                  d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6a6 6 0 1 1-6-6v2a4 4 0 1 0 4 4c0-2.21-1.79-4-4-4z"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="st-edge-pill">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
            <path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
              opacity="0"
            />
            <path
              fill="currentColor"
              d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"
            />
          </svg>
          <span>{edgeLabel}</span>
        </div>
      </div>
    </div>
  );
}
