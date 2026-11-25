"use client";

import DevToolHeader, { copyText } from "@/components/tools/DevToolHeader";
import {
  DEFAULT_PASSWORD_LENGTH,
  DEFAULT_SYMBOLS,
  MAX_PASSPHRASE_WORDS,
  MAX_PASSWORD_LENGTH,
  MIN_PASSPHRASE_WORDS,
  MIN_PASSWORD_LENGTH,
  SEPARATOR_OPTIONS,
  type PassphraseSeparator,
} from "@/lib/password/constants";
import type { PasswordLengthSlug } from "@/lib/password/length-landings";
import {
  entropyBitsPassphrase,
  entropyBitsRandom,
  generatePassphrase,
  generatePassword,
  strengthFromBits,
  type RandomPasswordOptions,
} from "@/lib/password/generate";
import "@/styles/password-generator.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import LengthLandingNav from "./LengthLandingNav";
import PasswordDisplay from "./PasswordDisplay";
import StrengthMeter from "./StrengthMeter";

export type PasswordGeneratorAppProps = {
  headerTitle?: string;
  headerLead?: string;
  initialLength?: number;
  currentLengthLanding?: PasswordLengthSlug;
};

export default function PasswordGeneratorApp({
  headerTitle = "Password Generator",
  headerLead = "Create strong random passwords and passphrases. Uses crypto.getRandomValues in your browser — nothing is uploaded or stored.",
  initialLength = DEFAULT_PASSWORD_LENGTH,
  currentLengthLanding,
}: PasswordGeneratorAppProps) {
  const [mode, setMode] = useState<"random" | "passphrase">("random");
  const [hidden, setHidden] = useState(false);
  const [password, setPassword] = useState("");
  const [genError, setGenError] = useState("");
  const [copyMsg, setCopyMsg] = useState("");

  const [random, setRandom] = useState<RandomPasswordOptions>(() => ({
    length: initialLength,
    upper: true,
    lower: true,
    digits: true,
    symbols: true,
    excludeAmbiguous: false,
    customSymbols: "",
    noRepeat: false,
  }));

  const [ppWords, setPpWords] = useState(5);
  const [ppSep, setPpSep] = useState<PassphraseSeparator>("-");
  const [ppCap, setPpCap] = useState(true);
  const [ppNum, setPpNum] = useState(false);
  const [bulk, setBulk] = useState<string[]>([]);

  const regenerate = useCallback(() => {
    if (mode === "random") {
      const r = generatePassword(random);
      if (r.error) {
        setGenError(r.error);
        setPassword("");
      } else {
        setGenError("");
        setPassword(r.value);
      }
    } else {
      const r = generatePassphrase({
        wordCount: ppWords,
        separator: ppSep,
        capitalize: ppCap,
        numberSuffix: ppNum,
      });
      setGenError("");
      setPassword(r.value);
    }
    setBulk([]);
  }, [mode, random, ppWords, ppSep, ppCap, ppNum]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  const bits = useMemo(() => {
    if (mode === "random") return entropyBitsRandom(random, random.length);
    return entropyBitsPassphrase(ppWords);
  }, [mode, random, ppWords]);

  const strength = strengthFromBits(bits);

  function toggleCategory(
    key: keyof Pick<RandomPasswordOptions, "upper" | "lower" | "digits" | "symbols">,
    next: boolean,
  ) {
    setRandom((s) => {
      const draft = { ...s, [key]: next };
      const anyOn = draft.upper || draft.lower || draft.digits || draft.symbols;
      if (!anyOn) return s;
      return draft;
    });
  }

  async function doCopy(text: string) {
    const ok = await copyText(text);
    setCopyMsg(ok ? "Copied!" : "Copy failed — select and copy manually.");
    setTimeout(() => setCopyMsg(""), 2500);
  }

  function bulkGenerate(n: number) {
    const list: string[] = [];
    for (let i = 0; i < n; i++) {
      if (mode === "random") {
        const r = generatePassword(random);
        if (!r.error) list.push(r.value);
      } else {
        list.push(generatePassphrase({ wordCount: ppWords, separator: ppSep, capitalize: ppCap, numberSuffix: ppNum }).value);
      }
    }
    setBulk(list);
  }

  return (
    <div className="dt-page tool-page pwd-page">
      <div className="dt-wrap">
        <DevToolHeader
          title={headerTitle}
          lead={headerLead}
          badges={["Runs in your browser", "Nothing is uploaded", "No signup"]}
        />
        <p className="pwd-privacy">Runs in your browser. Nothing is uploaded or stored.</p>

        <div className="qr-tabs" role="group" aria-label="Generator mode">
          <button type="button" aria-pressed={mode === "random"} onClick={() => setMode("random")}>
            Random password
          </button>
          <button type="button" aria-pressed={mode === "passphrase"} onClick={() => setMode("passphrase")}>
            Passphrase
          </button>
        </div>

        <div className="pwd-layout">
          <div className="dt-panel">
            {mode === "random" ? (
              <div className="dt-stack">
                <label className="dt-field">
                  Length ({random.length})
                  <input
                    type="range"
                    className="ic-slider"
                    min={MIN_PASSWORD_LENGTH}
                    max={MAX_PASSWORD_LENGTH}
                    value={random.length}
                    onChange={(e) => setRandom((s) => ({ ...s, length: parseInt(e.target.value, 10) }))}
                  />
                </label>
                <label className="dt-field">
                  Length
                  <input
                    className="dt-input"
                    type="number"
                    min={MIN_PASSWORD_LENGTH}
                    max={MAX_PASSWORD_LENGTH}
                    value={random.length}
                    onChange={(e) => setRandom((s) => ({ ...s, length: parseInt(e.target.value, 10) || s.length }))}
                  />
                </label>
                {(["upper", "lower", "digits", "symbols"] as const).map((k) => (
                  <label key={k} className="dt-check">
                    <input
                      type="checkbox"
                      checked={random[k]}
                      onChange={(e) => toggleCategory(k, e.target.checked)}
                    />
                    {k === "upper" && "Uppercase (A–Z)"}
                    {k === "lower" && "Lowercase (a–z)"}
                    {k === "digits" && "Numbers (0–9)"}
                    {k === "symbols" && "Symbols"}
                  </label>
                ))}
                <label className="dt-check">
                  <input
                    type="checkbox"
                    checked={random.excludeAmbiguous}
                    onChange={(e) => setRandom((s) => ({ ...s, excludeAmbiguous: e.target.checked }))}
                  />
                  Exclude ambiguous (O, 0, l, 1, I, |)
                </label>
                <label className="dt-check">
                  <input
                    type="checkbox"
                    checked={random.noRepeat}
                    onChange={(e) => setRandom((s) => ({ ...s, noRepeat: e.target.checked }))}
                  />
                  No repeated characters
                </label>
                <label className="dt-field">
                  Custom symbols (optional)
                  <input
                    className="dt-input"
                    value={random.customSymbols}
                    placeholder={DEFAULT_SYMBOLS}
                    onChange={(e) => setRandom((s) => ({ ...s, customSymbols: e.target.value }))}
                  />
                </label>
              </div>
            ) : (
              <div className="dt-stack">
                <label className="dt-field">
                  Words ({ppWords})
                  <input
                    type="range"
                    className="ic-slider"
                    min={MIN_PASSPHRASE_WORDS}
                    max={MAX_PASSPHRASE_WORDS}
                    value={ppWords}
                    onChange={(e) => setPpWords(parseInt(e.target.value, 10))}
                  />
                </label>
                <label className="dt-field">
                  Separator
                  <select className="dt-input" value={ppSep} onChange={(e) => setPpSep(e.target.value as PassphraseSeparator)}>
                    {SEPARATOR_OPTIONS.map((o) => (
                      <option key={o.label} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="dt-check">
                  <input type="checkbox" checked={ppCap} onChange={(e) => setPpCap(e.target.checked)} />
                  Capitalize each word
                </label>
                <label className="dt-check">
                  <input type="checkbox" checked={ppNum} onChange={(e) => setPpNum(e.target.checked)} />
                  Add random 4-digit suffix
                </label>
              </div>
            )}
          </div>

          <div className="dt-panel">
            {genError && (
              <p className="qr-note-warn" role="alert">
                {genError}
              </p>
            )}
            <PasswordDisplay value={password} hidden={hidden} />
            <StrengthMeter bits={bits} strength={strength} />
            <div className="qr-dl">
              <button type="button" className="dt-btn primary" disabled={!password} onClick={() => void doCopy(password)}>
                Copy
              </button>
              <button type="button" className="dt-btn" onClick={regenerate}>
                Regenerate
              </button>
              <button type="button" className="dt-btn" onClick={() => setHidden((h) => !h)}>
                {hidden ? "Show" : "Hide"}
              </button>
            </div>
            <p aria-live="polite" className="dt-status">
              {copyMsg}
            </p>
            <div className="pwd-bulk">
              <button type="button" className="dt-btn" onClick={() => bulkGenerate(5)}>
                Generate 5
              </button>
              <button type="button" className="dt-btn" style={{ marginLeft: 8 }} onClick={() => bulkGenerate(10)}>
                Generate 10
              </button>
              {bulk.length > 0 && (
                <>
                  <button type="button" className="dt-btn" style={{ marginLeft: 8 }} onClick={() => void doCopy(bulk.join("\n"))}>
                    Copy all
                  </button>
                  <pre>{bulk.join("\n")}</pre>
                </>
              )}
            </div>
          </div>
        </div>
        <LengthLandingNav currentLength={currentLengthLanding} />
      </div>
    </div>
  );
}