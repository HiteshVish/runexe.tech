"use client";

import { useMemo, useState } from "react";
import DevToolHeader, { copyText } from "@/components/tools/DevToolHeader";

type Mode = "encode" | "decode";

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

function toUrlSafe(b64: string) {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function encodeText(text: string, urlSafe: boolean) {
  const b64 = bytesToBase64(new TextEncoder().encode(text));
  return urlSafe ? toUrlSafe(b64) : b64;
}

function decodeText(input: string): string {
  let s = input.trim().replace(/^data:[^,]*,/, "").replace(/\s+/g, "");
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  if (s.length % 4 === 1) throw new Error("This is not valid Base64: the length is wrong.");
  s += "=".repeat((4 - (s.length % 4)) % 4);
  let bin: string;
  try {
    bin = atob(s);
  } catch {
    throw new Error("This is not valid Base64: it contains characters outside the Base64 alphabet.");
  }
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`Decoded ${bytes.length} ${bytes.length === 1 ? "byte" : "bytes"}, but they are binary data, not UTF-8 text.`);
  }
}

function formatSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export default function Base64App() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("Hello, RunExe!");
  const [urlSafe, setUrlSafe] = useState(false);
  const [fileOut, setFileOut] = useState<{ name: string; size: number; b64: string } | null>(null);
  const [withPrefix, setWithPrefix] = useState(false);
  const [mime, setMime] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const result = useMemo(() => {
    if (fileOut) {
      const body = urlSafe ? toUrlSafe(fileOut.b64) : fileOut.b64;
      return { ok: true, out: withPrefix && !urlSafe ? `data:${mime || "application/octet-stream"};base64,${body}` : body };
    }
    if (!input) return { ok: true, out: "" };
    try {
      return { ok: true, out: mode === "encode" ? encodeText(input, urlSafe) : decodeText(input) };
    } catch (e) {
      return { ok: false, out: "", err: (e as Error).message };
    }
  }, [input, mode, urlSafe, fileOut, withPrefix, mime]);

  function onFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const bytes = new Uint8Array(reader.result as ArrayBuffer);
      setFileOut({ name: file.name, size: file.size, b64: bytesToBase64(bytes) });
      setMime(file.type);
      setMode("encode");
      setMsg({ ok: true, text: `Encoded ${file.name} (${formatSize(file.size)}).` });
    };
    reader.onerror = () => setMsg({ ok: false, text: "Could not read that file." });
    reader.readAsArrayBuffer(file);
  }

  const status = !result.ok ? { ok: false, text: result.err! } : msg;

  return (
    <div className="dt-page tool-page">
      <div className="dt-wrap">
        <DevToolHeader
          title="Base64 Encoder & Decoder"
          lead="Encode text to Base64 or decode it back, with full UTF-8 support and a URL-safe option. You can also turn a file into Base64. Everything happens in this tab."
        />
        <div className="dt-panel">
          <div className="dt-toolbar">
            <div className="dt-seg" role="group" aria-label="Mode">
              {(["encode", "decode"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m && !fileOut}
                  onClick={() => {
                    setFileOut(null);
                    setMsg(null);
                    setMode(m);
                  }}
                >
                  {m === "encode" ? "Encode" : "Decode"}
                </button>
              ))}
            </div>
            <label className="dt-check">
              <input type="checkbox" checked={urlSafe} onChange={(e) => setUrlSafe(e.target.checked)} />
              URL-safe (- _ and no padding)
            </label>
            <span className="dt-spacer" />
            <button
              className="dt-btn"
              type="button"
              disabled={!!fileOut || !result.ok || !result.out}
              onClick={() => {
                setInput(result.out);
                setMode(mode === "encode" ? "decode" : "encode");
                setMsg(null);
              }}
            >
              Swap
            </button>
            <button
              className="dt-btn primary"
              type="button"
              disabled={!result.out}
              onClick={async () => {
                const ok = await copyText(result.out);
                setMsg({ ok, text: ok ? "Output copied." : "Copy failed — select the output and copy manually." });
              }}
            >
              Copy output
            </button>
          </div>

          <div className="dt-grid2">
            <div>
              <div className="dt-label">
                <span>{fileOut ? "File" : mode === "encode" ? "Text" : "Base64"}</span>
                <button
                  className="dt-btn"
                  type="button"
                  style={{ padding: "4px 10px", fontSize: ".72rem" }}
                  onClick={() => {
                    setInput("");
                    setFileOut(null);
                    setMsg(null);
                  }}
                >
                  Clear
                </button>
              </div>
              {fileOut ? (
                <div className="dt-textarea" style={{ display: "grid", placeContent: "center", textAlign: "center", fontFamily: "var(--font-body)" }}>
                  <strong>{fileOut.name}</strong>
                  <span style={{ color: "var(--ink-60)", fontSize: ".84rem" }}>
                    {formatSize(fileOut.size)}
                    {mime ? ` · ${mime}` : ""}
                  </span>
                </div>
              ) : (
                <textarea
                  className="dt-textarea"
                  aria-label={mode === "encode" ? "Text to encode" : "Base64 to decode"}
                  spellCheck={false}
                  value={input}
                  placeholder={mode === "encode" ? "Type or paste text…" : "Paste Base64…"}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setMsg(null);
                  }}
                />
              )}
            </div>
            <div>
              <div className="dt-label">
                <span>{mode === "encode" || fileOut ? "Base64" : "Text"}</span>
                <span style={{ letterSpacing: 0, textTransform: "none", fontWeight: 600 }}>
                  {result.out ? `${result.out.length.toLocaleString()} chars` : ""}
                </span>
              </div>
              <textarea className="dt-textarea" aria-label="Output" readOnly spellCheck={false} value={result.out} />
            </div>
          </div>

          <div className="dt-file" style={{ marginTop: 14 }}>
            <span>Or encode a file:</span>
            <input type="file" aria-label="File to encode" onChange={(e) => onFile(e.target.files?.[0])} />
            {fileOut && (
              <label className="dt-check">
                <input
                  type="checkbox"
                  checked={withPrefix}
                  disabled={urlSafe}
                  onChange={(e) => setWithPrefix(e.target.checked)}
                />
                Include data URI prefix
              </label>
            )}
          </div>

          <div className={`dt-status ${status ? (status.ok ? "ok" : "err") : ""}`} role="status" aria-live="polite">
            {status?.text}
          </div>
        </div>
      </div>
    </div>
  );
}
