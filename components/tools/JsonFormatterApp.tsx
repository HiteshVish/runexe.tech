"use client";

import { useState } from "react";
import DevToolHeader, { copyText } from "@/components/tools/DevToolHeader";

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
    <div className="dt-page tool-page">
      <div className="dt-wrap">
        <DevToolHeader
          title="JSON Formatter & Validator"
          lead="Paste JSON, then format, minify, or validate. Everything stays in this tab — nothing is uploaded."
        />
        <div className="dt-panel">
          <div className="dt-toolbar">
            <button
              className="dt-btn primary"
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
              className="dt-btn"
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
              className="dt-btn"
              type="button"
              onClick={() => {
                const r = parse();
                set(r.ok, r.ok ? "Valid JSON." : r.err);
              }}
            >
              Validate
            </button>
            <span className="dt-spacer" />
            <button
              className="dt-btn"
              type="button"
              onClick={async () => {
                const ok = await copyText(src);
                set(ok, ok ? "Copied." : "Copy failed — select the text and copy manually.");
              }}
            >
              Copy
            </button>
            <button className="dt-btn" type="button" onClick={() => { setSrc(""); setStatus({ msg: "" }); }}>
              Clear
            </button>
          </div>
          <textarea
            id="src"
            className="dt-textarea tall"
            aria-label="JSON input"
            spellCheck={false}
            placeholder='{ "hello": "runexe" }'
            value={src}
            onChange={(e) => setSrc(e.target.value)}
          />
          <div className={`dt-status ${status.msg ? (status.ok ? "ok" : "err") : ""}`} id="st" role="status" aria-live="polite">
            {status.msg}
          </div>
        </div>
      </div>
    </div>
  );
}
