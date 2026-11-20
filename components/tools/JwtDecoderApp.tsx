"use client";

import { useEffect, useMemo, useState } from "react";
import DevToolHeader, { copyText } from "@/components/tools/DevToolHeader";

type Json = Record<string, unknown>;

function b64urlToText(part: string): string {
  let s = part.replace(/-/g, "+").replace(/_/g, "/");
  s += "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

function textToB64url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeJwt(token: string) {
  const parts = token.trim().split(".");
  if (parts.length < 2 || parts.length > 3) {
    throw new Error("A JWT has three parts separated by dots: header.payload.signature.");
  }
  const parse = (p: string, label: string): Json => {
    try {
      const v = JSON.parse(b64urlToText(p));
      if (typeof v !== "object" || v === null || Array.isArray(v)) throw new Error();
      return v;
    } catch {
      throw new Error(`The ${label} is not Base64URL-encoded JSON.`);
    }
  };
  return { parts, header: parse(parts[0], "header"), payload: parse(parts[1], "payload") };
}

const TIME_CLAIMS: Record<string, string> = { exp: "Expires", nbf: "Not before", iat: "Issued at" };
const REGISTERED_CLAIMS: Record<string, string> = {
  iss: "Issuer",
  sub: "Subject (who the token is about)",
  aud: "Audience (who the token is for)",
  jti: "Token ID",
};

function describeTime(sec: number) {
  const d = new Date(sec * 1000);
  return { local: d.toLocaleString(), utc: d.toISOString().replace(".000Z", "Z") };
}

function relative(sec: number, now: number) {
  const diff = sec - now;
  const abs = Math.abs(diff);
  const unit =
    abs < 90 ? `${abs}s` : abs < 5400 ? `${Math.round(abs / 60)} min` : abs < 172800 ? `${Math.round(abs / 3600)} h` : `${Math.round(abs / 86400)} days`;
  return diff >= 0 ? `in ${unit}` : `${unit} ago`;
}

export default function JwtDecoderApp() {
  const [token, setToken] = useState("");
  const [now, setNow] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setNow(Math.floor(Date.now() / 1000));
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const decoded = useMemo(() => {
    if (!token.trim()) return null;
    try {
      return { ok: true as const, ...decodeJwt(token) };
    } catch (e) {
      return { ok: false as const, err: (e as Error).message };
    }
  }, [token]);

  function loadSample() {
    const t = Math.floor(Date.now() / 1000);
    const header = { alg: "HS256", typ: "JWT" };
    const payload = { sub: "1234567890", name: "Ada Lovelace", role: "admin", iat: t, exp: t + 3600 };
    setToken(`${textToB64url(JSON.stringify(header))}.${textToB64url(JSON.stringify(payload))}.sample-signature-not-valid`);
    setMsg(null);
  }

  const status = decoded && !decoded.ok ? { ok: false, text: decoded.err } : msg;
  const payload = decoded?.ok ? decoded.payload : null;
  const exp = typeof payload?.exp === "number" ? payload.exp : null;
  const nbf = typeof payload?.nbf === "number" ? payload.nbf : null;
  const state =
    !payload || !now
      ? null
      : exp !== null && exp < now
        ? { cls: "err", text: `Expired ${relative(exp, now)}` }
        : nbf !== null && nbf > now
          ? { cls: "warn", text: `Not valid until ${relative(nbf, now)}` }
          : exp !== null
            ? { cls: "ok", text: `Not expired · expires ${relative(exp, now)}` }
            : { cls: "warn", text: "No expiry (exp) claim" };

  return (
    <div className="dt-page tool-page">
      <div className="dt-wrap">
        <DevToolHeader
          title="JWT Decoder"
          lead="Paste a JSON Web Token to read its header and payload, with exp, iat and nbf shown as real dates. The token is decoded in this tab and is never sent anywhere."
        />
        <div className="dt-stack">
          <div className="dt-panel">
            <div className="dt-toolbar">
              <div className="dt-label" style={{ margin: 0 }}>Encoded token</div>
              <span className="dt-spacer" />
              <button className="dt-btn" type="button" onClick={loadSample}>
                Load sample
              </button>
              <button className="dt-btn" type="button" onClick={() => { setToken(""); setMsg(null); }}>
                Clear
              </button>
            </div>
            <textarea
              className="dt-textarea short"
              aria-label="JWT"
              spellCheck={false}
              placeholder="eyJhbGciOi…"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setMsg(null);
              }}
            />
            {decoded?.ok && (
              <div className="dt-jwt-parts" style={{ marginTop: 12 }} aria-label="Token parts">
                <span className="h">{decoded.parts[0]}</span>.<span className="p">{decoded.parts[1]}</span>
                {decoded.parts[2] !== undefined && (
                  <>
                    .<span className="s">{decoded.parts[2]}</span>
                  </>
                )}
              </div>
            )}
            <div className={`dt-status ${status ? (status.ok ? "ok" : "err") : ""}`} role="status" aria-live="polite">
              {status?.text}
            </div>
          </div>

          {decoded?.ok && (
            <>
              <div className="dt-grid2">
                {(
                  [
                    ["Header", decoded.header],
                    ["Payload", decoded.payload],
                  ] as const
                ).map(([label, obj]) => (
                  <div className="dt-panel" key={label}>
                    <div className="dt-label">
                      <span>{label}</span>
                      <button
                        className="dt-btn"
                        type="button"
                        style={{ padding: "4px 10px", fontSize: ".72rem" }}
                        onClick={async () => {
                          const ok = await copyText(JSON.stringify(obj, null, 2));
                          setMsg({ ok, text: ok ? `${label} copied.` : "Copy failed." });
                        }}
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="dt-json">{JSON.stringify(obj, null, 2)}</pre>
                  </div>
                ))}
              </div>

              <div className="dt-panel">
                <div className="dt-label">
                  <span>Claims</span>
                  {state && <span className={`dt-pill ${state.cls}`}>{state.text}</span>}
                </div>
                <table className="dt-claims">
                  <thead>
                    <tr>
                      <th>Claim</th>
                      <th>Value</th>
                      <th>Meaning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(decoded.payload).map(([k, v]) => {
                      const isTime = k in TIME_CLAIMS && typeof v === "number";
                      const t = isTime ? describeTime(v as number) : null;
                      return (
                        <tr key={k}>
                          <td>
                            <code>{k}</code>
                          </td>
                          <td>
                            <code>{typeof v === "string" ? v : JSON.stringify(v)}</code>
                          </td>
                          <td>
                            {t ? (
                              <>
                                {TIME_CLAIMS[k]}: {t.local}
                                <br />
                                <span style={{ color: "var(--ink-60)" }}>
                                  {t.utc}
                                  {now ? ` · ${relative(v as number, now)}` : ""}
                                </span>
                              </>
                            ) : k in REGISTERED_CLAIMS ? (
                              REGISTERED_CLAIMS[k]
                            ) : (
                              <span style={{ color: "var(--ink-60)" }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="dt-note">
                  Algorithm: <strong>{String(decoded.header.alg ?? "not set")}</strong>. This tool decodes the token
                  only; it does not verify the signature, so do not trust the claims until your server has checked it.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
