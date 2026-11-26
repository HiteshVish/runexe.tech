"use client";

import type { ConnectionInfo, SpeedTestResult, TestPhase } from "@/lib/speed-test/types";

type Props = {
  phase: TestPhase;
  running: boolean;
  downloadMbps: number;
  uploadMbps: number | null;
  downloadPeak: number;
  uploadPeak: number;
  downloadFloor: number | null;
  uploadFloor: number | null;
  data: Partial<SpeedTestResult> | null;
  info: ConnectionInfo | null;
};

function fmtMbps(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n) || n <= 0) return "—";
  if (n >= 100) return Math.round(n).toString();
  return n.toFixed(digits);
}

function fmtMs(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Math.round(n)}`;
}

function maskIp(ip: string): string {
  if (ip.includes(":")) return `${ip.split(":").slice(0, 2).join(":")}:…`;
  const p = ip.split(".");
  if (p.length !== 4) return ip;
  return `${p[0]}.${p[1]}.××.××`;
}

export default function MetricGrid({
  phase,
  running,
  downloadMbps,
  uploadMbps,
  downloadPeak,
  uploadPeak,
  downloadFloor,
  uploadFloor,
  data,
  info,
}: Props) {
  const dlActive = running && phase === "download";
  const ulActive = running && phase === "upload";
  const ping = data?.pingMs ?? null;
  const jitter = data?.jitterMs ?? null;
  const loadedDl = data?.loadedDownloadLatencyMs ?? null;
  const loadedUl = data?.loadedUploadLatencyMs ?? null;
  const loaded =
    loadedDl != null && loadedUl != null ? (loadedDl + loadedUl) / 2 : loadedDl ?? loadedUl;

  const nodeTitle = info?.location || info?.city || info?.serverNode || "RunExe Edge";
  const isp = info?.isp || "Local Network";

  return (
    <div className="st-cards">
      <article className="st-card">
        <div className="st-card-top">
          <div className="st-card-label">
            <span className="st-card-ico st-card-ico--cyan" aria-hidden>
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M5 20h14v-2H5v2zM11 4v10.17l-3.59-3.58L6 12l6 6 6-6-1.41-1.41L13 14.17V4h-2z" />
              </svg>
            </span>
            <span>DOWNLOAD</span>
          </div>
          <span className={`st-chip${dlActive ? " is-active" : downloadMbps > 0 ? " is-ok" : ""}`}>
            {dlActive ? "ACTIVE" : downloadMbps > 0 ? "STABLE" : "IDLE"}
          </span>
        </div>
        <div className="st-card-main">
          <div className="st-card-value">
            <span>{fmtMbps(downloadMbps || null)}</span>
            <span className="st-card-unit">Mbps</span>
          </div>
          <p className="st-card-sub">Multi-thread TCP throughput</p>
        </div>
        <div className="st-card-foot">
          <div>
            <span className="st-k">PEAK</span>
            <span className="st-v">{fmtMbps(downloadPeak || null)} Mbps</span>
          </div>
          <div className="st-vdiv" />
          <div className="st-card-foot-end">
            <span className="st-k">MIN</span>
            <span className="st-v">{fmtMbps(downloadFloor)} Mbps</span>
          </div>
        </div>
      </article>

      <article className="st-card">
        <div className="st-card-top">
          <div className="st-card-label">
            <span className="st-card-ico st-card-ico--red" aria-hidden>
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M5 4h14v2H5V4zm6 16V9.83l-3.59 3.58L6 12l6-6 6 6-1.41 1.41L13 9.83V20h-2z" />
              </svg>
            </span>
            <span>UPLOAD</span>
          </div>
          <span className={`st-chip${ulActive ? " is-active is-pulse" : uploadMbps ? " is-ok" : ""}`}>
            {ulActive ? "ACTIVE" : uploadMbps ? "STABLE" : "IDLE"}
          </span>
        </div>
        <div className="st-card-main">
          <div className="st-card-value st-card-value--red">
            <span>{fmtMbps(uploadMbps)}</span>
            <span className="st-card-unit">Mbps</span>
          </div>
          <p className="st-card-sub">Upstream socket stream test</p>
        </div>
        <div className="st-card-foot">
          <div>
            <span className="st-k">BURST</span>
            <span className="st-v">{fmtMbps(uploadPeak || null)} Mbps</span>
          </div>
          <div className="st-vdiv" />
          <div className="st-card-foot-end">
            <span className="st-k">FLOOR</span>
            <span className="st-v">{fmtMbps(uploadFloor)} Mbps</span>
          </div>
        </div>
      </article>

      <article className="st-card">
        <div className="st-card-top">
          <div className="st-card-label">
            <span className="st-card-ico st-card-ico--green" aria-hidden>
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="currentColor"
                  d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A8.962 8.962 0 0 0 12 4c-4.97 0-8.99 4.03-8.99 9s4.02 9 8.99 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"
                />
              </svg>
            </span>
            <span>LATENCY</span>
          </div>
          <span className="st-chip is-ok">{jitter != null ? `${jitter.toFixed(1)}ms JITTER` : "0% LOSS"}</span>
        </div>
        <div className="st-card-main">
          <div className="st-card-value st-card-value--green">
            <span>{fmtMs(ping)}</span>
            <span className="st-card-unit">ms</span>
          </div>
          <p className="st-card-sub">
            {jitter != null ? `Jitter: ${jitter.toFixed(1)}ms` : "Idle round-trip latency"}
          </p>
        </div>
        <div className="st-card-foot">
          <div>
            <span className="st-k">UNLOADED</span>
            <span className="st-v">{ping != null ? `${fmtMs(ping)} ms` : "—"}</span>
          </div>
          <div className="st-vdiv" />
          <div className="st-card-foot-end">
            <span className="st-k">LOADED</span>
            <span className="st-v">{loaded != null ? `${fmtMs(loaded)} ms` : "—"}</span>
          </div>
        </div>
      </article>

      <article className="st-card">
        <div className="st-card-top">
          <div className="st-card-label">
            <span className="st-card-ico st-card-ico--cyan" aria-hidden>
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="currentColor"
                  d="M20 13H4v-2h16v2zm0-6H4V5h16v2zm0 12H4v-2h16v2z"
                />
              </svg>
            </span>
            <span>TELEMETRY NODE</span>
          </div>
          <span className="st-verified" aria-hidden>
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
            </svg>
          </span>
        </div>
        <div className="st-card-main st-card-main--node">
          <div className="st-node-title">{nodeTitle}</div>
          <div className="st-node-proto">{info?.serverNode || "runexe.tech"}</div>
          <p className="st-card-sub">ISP: {isp}</p>
        </div>
        <div className="st-card-foot">
          <div>
            <span className="st-k">CLIENT IP</span>
            <span className="st-v">{info?.ip ? maskIp(info.ip) : "—"}</span>
          </div>
          <div className="st-vdiv" />
          <div className="st-card-foot-end">
            <span className="st-k">SERVER</span>
            <span className="st-v">{info?.serverNode || "runexe.tech"}</span>
          </div>
        </div>
      </article>
    </div>
  );
}
