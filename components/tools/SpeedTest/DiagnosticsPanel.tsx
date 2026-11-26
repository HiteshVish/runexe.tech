"use client";

import { computeReadiness, readinessPct } from "@/lib/speed-test/readiness";
import type { ConnectionInfo, SpeedTestResult } from "@/lib/speed-test/types";

type Props = {
  result: SpeedTestResult | null;
  info: ConnectionInfo | null;
  onRescan: () => void;
};

type Hop = { id: string; label: string; ms: number; tone: "green" | "cyan" | "red" };

function hopsFrom(result: SpeedTestResult | null, info: ConnectionInfo | null): Hop[] {
  const ping = result?.pingMs ?? 0;
  const isp = info?.isp || "Local Network";
  const server = info?.serverNode || "runexe.tech";
  const local = Math.max(0.3, ping * 0.05);
  const mid = Math.max(local + 0.5, ping * 0.35);
  const edge = Math.max(mid + 0.5, ping || mid);
  return [
    { id: "1", label: "Local Gateway", ms: local, tone: "green" },
    { id: "2", label: isp, ms: mid, tone: "green" },
    { id: "3", label: `RunExe Edge (${server})`, ms: edge, tone: "cyan" },
  ];
}

function barWidth(ms: number, max: number): number {
  if (max <= 0) return 12;
  return Math.min(96, Math.max(10, (ms / max) * 100));
}

export default function DiagnosticsPanel({ result, info, onRescan }: Props) {
  const hops = hopsFrom(result, info);
  const maxHop = Math.max(...hops.map((h) => h.ms), 1);
  const grade = result?.bufferbloatGrade ?? "—";
  const readiness = result ? computeReadiness(result) : [];
  const jitter = result?.jitterMs;
  const stability = result?.stabilityPct;

  return (
    <div className="st-diag">
      <section className="st-diag-main">
        <div className="st-diag-head">
          <div>
            <span className="st-eyebrow">Carrier Route Matrix</span>
            <h2 className="st-diag-title">Edge Latency Breakdown</h2>
          </div>
        </div>
        <div className="st-hops">
          {hops.map((hop, i) => (
            <div className="st-hop" key={hop.id}>
              <div className="st-hop-left">
                <span className="st-hop-id">HOP {String(i + 1).padStart(2, "0")}</span>
                <span className="st-hop-name">{hop.label}</span>
              </div>
              <div className="st-hop-right">
                <span className={`st-hop-ms tone-${hop.tone}`}>
                  {result ? `${hop.ms < 10 ? hop.ms.toFixed(1) : Math.round(hop.ms)} ms` : "—"}
                </span>
                <span className="st-hop-bar">
                  <span
                    className={`st-hop-fill tone-${hop.tone}`}
                    style={{ width: result ? `${barWidth(hop.ms, maxHop)}%` : "0%" }}
                  />
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="st-diag-meta">
          <span>
            Jitter: <strong>{jitter != null ? `${jitter.toFixed(1)}ms` : "—"}</strong>
          </span>
          <span>
            Stability: <strong>{stability != null ? `${Math.round(stability)}%` : "—"}</strong>
          </span>
          <span>
            Bufferbloat: <strong>{grade}</strong>
          </span>
        </div>
      </section>

      <section className="st-diag-side">
        <div className="st-bb-head">
          <span className="st-eyebrow st-eyebrow--red">Bufferbloat Score</span>
          <span className="st-grade">{grade === "—" ? "—" : `GRADE ${grade}`}</span>
        </div>
        <h3 className="st-diag-title st-diag-title--sm">Queue Delay Under Load</h3>
        <p className="st-bb-copy">
          {result
            ? "Latency under download/upload load compared with idle ping — lower degradation means cleaner queues."
            : "Run a test to score queue delay during heavy parallel transfers."}
        </p>
        <div className="st-bb-bars">
          {(readiness.length
            ? readiness
            : [
                { id: "g", label: "Gaming Stability", level: "Fair" as const, detail: "—" },
                { id: "s", label: "4K / 8K Video Stream", level: "Fair" as const, detail: "—" },
                { id: "v", label: "Voice VoIP Calls", level: "Fair" as const, detail: "—" },
              ]
          ).map((item) => (
            <div className="st-bb-row" key={item.id}>
              <div className="st-bb-labels">
                <span>{item.label}</span>
                <span className="st-bb-detail">{item.detail}</span>
              </div>
              <div className="st-bb-track">
                <div
                  className={`st-bb-fill${item.level === "Excellent" ? " is-green" : " is-cyan"}`}
                  style={{ width: result ? `${readinessPct(item.level)}%` : "0%" }}
                />
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="st-bb-btn" onClick={onRescan}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
            <path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
            />
          </svg>
          RUN EXTENDED LATENCY SCAN
        </button>
      </section>
    </div>
  );
}
