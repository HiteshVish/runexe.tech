"use client";

import { useState } from "react";
import "@/styles/json-formatter.css";

export default function JsonFormatterApp() {
  const [src, setSrc] = useState('{ "hello": "runexe" }');
  const [status, setStatus] = useState<{ ok?: boolean; msg: string }>({ msg: "" });

  function parse() {
    try {
      return { ok: true as const, data: JSON.parse(src) };
    } catch (e) {
      return { ok: false as const, err: (e as Error).message };
    }
  }

  function set(ok: boolean, msg: string) {
    setStatus({ ok, msg });
  }

  return (
    <div className="json-fmt-page tool-page">
      <div className="wrap">
        <div style={{ fontSize: ".68rem", fontWeight: 600, letterSpacing: ".35em", textTransform: "uppercase", color: "var(--crimson)" }}>
          Open source
        </div>
        <h1>JSON Formatter</h1>
        <p className="lead">Paste JSON, then format, minify, or validate. Everything stays in this tab — nothing is uploaded.</p>
        <div className="actions">
          <button
            className="primary"
            type="button"
            onClick={() => {
              const r = parse();
              if (!r.ok) return set(false, r.err);
              setSrc(JSON.stringify(r.data, null, 2));
              set(true, "Formatted.");
            }}
          >
            Format
          </button>
          <button
            type="button"
            onClick={() => {
              const r = parse();
              if (!r.ok) return set(false, r.err);
              setSrc(JSON.stringify(r.data));
              set(true, "Minified.");
            }}
          >
            Minify
          </button>
          <button
            type="button"
            onClick={() => {
              const r = parse();
              set(r.ok, r.ok ? "Valid JSON." : r.err);
            }}
          >
            Validate
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(src).then(() => set(true, "Copied."));
            }}
          >
            Copy
          </button>
          <button type="button" onClick={() => { setSrc(""); setStatus({ msg: "" }); }}>
            Clear
          </button>
        </div>
        <textarea
          id="src"
          spellCheck={false}
          placeholder='{ "hello": "runexe" }'
          value={src}
          onChange={(e) => setSrc(e.target.value)}
        />
        <div className={`status ${status.msg ? (status.ok ? "ok" : "err") : ""}`} id="st">
          {status.msg}
        </div>
      </div>
    </div>
  );
}