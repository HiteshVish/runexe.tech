"use client";

import { useCallback, useEffect, useState } from "react";
import DevToolHeader, { copyText } from "@/components/tools/DevToolHeader";

const MAX = 1000;

/** RFC 9562 version 4 UUID from crypto.getRandomValues (works on plain http too, unlike randomUUID). */
function uuidV4(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export default function UuidGeneratorApp() {
  const [count, setCount] = useState(5);
  const [upper, setUpper] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [braces, setBraces] = useState(false);
  const [list, setList] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const generate = useCallback(() => {
    const n = Math.min(MAX, Math.max(1, Math.floor(count) || 1));
    setList(Array.from({ length: n }, uuidV4));
    setMsg(null);
  }, [count]);

  useEffect(() => {
    generate();
    // Only on first load; later runs are triggered by the button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = list.map((u) => {
    let s = hyphens ? u : u.replace(/-/g, "");
    if (upper) s = s.toUpperCase();
    return braces ? `{${s}}` : s;
  });
  const text = shown.join("\n");

  return (
    <div className="dt-page tool-page">
      <div className="dt-wrap">
        <DevToolHeader
          title="UUID Generator"
          lead="Generate random version 4 UUIDs with your browser's cryptographic random number generator. Make one or up to 1,000 at a time and copy them in one click."
        />
        <div className="dt-panel">
          <div className="dt-toolbar">
            <label className="dt-field">
              How many
              <input
                className="dt-input"
                type="number"
                min={1}
                max={MAX}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                onKeyDown={(e) => e.key === "Enter" && generate()}
              />
            </label>
            <label className="dt-check">
              <input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} />
              Uppercase
            </label>
            <label className="dt-check">
              <input type="checkbox" checked={hyphens} onChange={(e) => setHyphens(e.target.checked)} />
              Hyphens
            </label>
            <label className="dt-check">
              <input type="checkbox" checked={braces} onChange={(e) => setBraces(e.target.checked)} />
              {"{Braces}"}
            </label>
            <span className="dt-spacer" />
            <button className="dt-btn primary" type="button" onClick={generate}>
              Generate
            </button>
            <button
              className="dt-btn"
              type="button"
              disabled={!text}
              onClick={async () => {
                const ok = await copyText(text);
                setMsg({ ok, text: ok ? `Copied ${shown.length} UUID${shown.length === 1 ? "" : "s"}.` : "Copy failed." });
              }}
            >
              Copy all
            </button>
          </div>
          <textarea
            className="dt-textarea tall"
            aria-label="Generated UUIDs"
            readOnly
            spellCheck={false}
            value={text}
          />
          <div className={`dt-status ${msg ? (msg.ok ? "ok" : "err") : ""}`} role="status" aria-live="polite">
            {msg?.text ?? (shown.length ? `${shown.length} UUID${shown.length === 1 ? "" : "s"} ready.` : "")}
          </div>
        </div>
      </div>
    </div>
  );
}
