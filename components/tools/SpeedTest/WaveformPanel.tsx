"use client";

import type { SpeedSample } from "@/lib/speed-test/types";

type Props = { samples: SpeedSample[]; active: boolean };

function buildPath(samples: SpeedSample[], h = 100, w = 800): { line: string; area: string } {
  if (!samples.length) {
    const flat = `M 0 ${h * 0.65} L ${w} ${h * 0.65}`;
    return { line: flat, area: `M 0 ${h} L 0 ${h * 0.65} L ${w} ${h * 0.65} L ${w} ${h} Z` };
  }
  const recent = samples.slice(-48);
  const max = Math.max(1, ...recent.map((s) => s.mbps));
  const pts = recent.map((s, i) => {
    const x = (i / Math.max(1, recent.length - 1)) * w;
    const y = h - (s.mbps / max) * (h * 0.72) - h * 0.12;
    return { x, y };
  });
  let line = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const cx = (p0.x + p1.x) / 2;
    line += ` Q ${cx} ${p0.y}, ${p1.x} ${p1.y}`;
  }
  const area = `M 0 ${h} L ${pts[0].x} ${pts[0].y}` + line.slice(1) + ` L ${w} ${h} Z`;
  return { line, area };
}

export default function WaveformPanel({ samples, active }: Props) {
  const { line, area } = buildPath(samples);
  return (
    <div className="st-wave">
      <div className="st-wave-head">
        <div className="st-wave-title">
          <span>LIVE INGESTION WAVEFORM</span>
          <span className={`st-wave-dot${active ? " is-on" : ""}`} />
        </div>
        <span className="st-wave-meta">TIME DOMAIN: 250ms WINDOW</span>
      </div>
      <div className="st-wave-plot">
        <svg viewBox="0 0 800 100" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="stWaveStroke" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="var(--crimson, #8B1A1A)" stopOpacity="0.35" />
              <stop offset="45%" stopColor="var(--crimson, #8B1A1A)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--ink, #111)" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id="stWaveFill" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="var(--crimson, #8B1A1A)" stopOpacity="0.22" />
              <stop offset="70%" stopColor="var(--crimson, #8B1A1A)" stopOpacity="0.06" />
              <stop offset="100%" stopColor="var(--crimson, #8B1A1A)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#stWaveFill)" />
          <path d={line} fill="none" stroke="url(#stWaveStroke)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
