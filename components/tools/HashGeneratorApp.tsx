"use client";

import { useEffect, useRef, useState } from "react";
import DevToolHeader, { copyText } from "@/components/tools/DevToolHeader";

const ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
type Algo = (typeof ALGOS)[number];
type Source = { kind: "text"; text: string } | { kind: "file"; name: string; size: number; data: ArrayBuffer };

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function formatSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export default function HashGeneratorApp() {
  const [src, setSrc] = useState<Source>({ kind: "text", text: "Hello, RunExe!" });
  const [upper, setUpper] = useState(false);
  const [hashes, setHashes] = useState<Partial<Record<Algo, string>>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = useRef(0);

  useEffect(() => {
    const id = ++run.current;
    if (!globalThis.crypto?.subtle) {
      setMsg({ ok: false, text: "Your browser blocks Web Crypto on this page. Open it over https to hash." });
      return;
    }
    const data = src.kind === "text" ? new TextEncoder().encode(src.text) : src.data;
    Promise.all(ALGOS.map((a) => crypto.subtle.digest(a, data).then((d) => [a, toHex(d)] as const)))
      .then((pairs) => {
        if (id === run.current) setHashes(Object.fromEntries(pairs));
      })
      .catch(() => id === run.current && setMsg({ ok: false, text: "Hashing failed." }));
  }, [src]);

  function onFile(file: File | undefined) {
    if (!file) return;
    file
      .arrayBuffer()
      .then((data) => {
        setSrc({ kind: "file", name: file.name, size: file.size, data });
        setMsg({ ok: true, text: `Hashed ${file.name} (${formatSize(file.size)}).` });
      })
      .catch(() => setMsg({ ok: false, text: "Could not read that file." }));
  }

  return (
    <div className="dt-page tool-page">
      <div className="dt-wrap">
        <DevToolHeader
          title="Hash Generator"
          lead="Create SHA-1, SHA-256, SHA-384 and SHA-512 hashes of text or a file. Hashing uses your browser's Web Crypto API, so the input never leaves this tab."
        />
        <div className="dt-grid2">
          <div className="dt-panel">
            <div className="dt-label">
              <span>{src.kind === "file" ? "File" : "Text"}</span>
              <button
                className="dt-btn"
                type="button"
                style={{ padding: "4px 10px", fontSize: ".72rem" }}
                onClick={() => {
                  setSrc({ kind: "text", text: "" });
                  setMsg(null);
                }}
              >
                Clear
              </button>
            </div>
            {src.kind === "file" ? (
              <div className="dt-textarea" style={{ display: "grid", placeContent: "center", textAlign: "center", fontFamily: "var(--font-body)" }}>
                <strong>{src.name}</strong>
                <span style={{ color: "var(--ink-60)", fontSize: ".84rem" }}>{formatSize(src.size)}</span>
              </div>
            ) : (
              <textarea
                className="dt-textarea"
                aria-label="Text to hash"
                spellCheck={false}
                placeholder="Type or paste text…"
                value={src.text}
                onChange={(e) => {
                  setSrc({ kind: "text", text: e.target.value });
                  setMsg(null);
                }}
              />
            )}
            <div className="dt-file" style={{ marginTop: 12 }}>
              <span>Or hash a file:</span>
              <input type="file" aria-label="File to hash" onChange={(e) => onFile(e.target.files?.[0])} />
            </div>
          </div>

          <div className="dt-panel">
            <div className="dt-label">
              <span>Hashes (hex)</span>
              <label className="dt-check" style={{ letterSpacing: 0, textTransform: "none" }}>
                <input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} />
                Uppercase
              </label>
            </div>
            <div className="dt-rows">
              {ALGOS.map((a) => {
                const h = hashes[a] ? (upper ? hashes[a]!.toUpperCase() : hashes[a]!) : "";
                return (
                  <div className="dt-row" key={a}>
                    <b>{a}</b>
                    <code>{h || "…"}</code>
                    <button
                      className="dt-btn"
                      type="button"
                      style={{ padding: "6px 10px", fontSize: ".74rem" }}
                      disabled={!h}
                      onClick={async () => {
                        const ok = await copyText(h);
                        setMsg({ ok, text: ok ? `${a} copied.` : "Copy failed." });
                      }}
                    >
                      Copy
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="dt-note">
              MD5 is not offered: browsers do not include it in Web Crypto, and it is no longer safe for security uses.
            </p>
          </div>
        </div>
        <div className={`dt-status ${msg ? (msg.ok ? "ok" : "err") : ""}`} role="status" aria-live="polite">
          {msg?.text}
        </div>
      </div>
    </div>
  );
}
