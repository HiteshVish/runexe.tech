"use client";

import DevToolHeader, { copyText } from "@/components/tools/DevToolHeader";
import { topKeywords } from "@/lib/text/keywords";
import { LIMIT_PRESETS, type LimitPreset } from "@/lib/text/limits";
import { analyzeText, countGraphemes } from "@/lib/text/stats";
import { collapseWhitespace, toLower, toSentenceCase, toTitleCase, toUpper } from "@/lib/text/transform";
import "@/styles/word-counter.css";
import { useEffect, useMemo, useState } from "react";
import WordLandingNav from "./WordLandingNav";

export type WordCounterAppProps = {
  headerTitle?: string;
  headerLead?: string;
  highlight?: "all" | "chars" | "time";
  landing?: "word-counter" | "character-counter" | "reading-time-calculator";
};

const HUGE = 100_000;

export default function WordCounterApp({
  headerTitle = "Word & Character Counter",
  headerLead = "Count words, characters, sentences and reading time as you type. Unicode-aware — nothing is uploaded or stored.",
  highlight = "all",
  landing = "word-counter",
}: WordCounterAppProps) {
  const [text, setText] = useState("");
  const [debounced, setDebounced] = useState("");
  const [ignoreStop, setIgnoreStop] = useState(true);
  const [minLen, setMinLen] = useState(3);
  const [preset, setPreset] = useState<LimitPreset | null>(null);
  const [customLimit, setCustomLimit] = useState("");
  const [liveMsg, setLiveMsg] = useState("");
  const [ariaSummary, setAriaSummary] = useState("");

  useEffect(() => {
    if (text.length <= HUGE) {
      setDebounced(text);
      return;
    }
    const t = setTimeout(() => setDebounced(text), 50);
    return () => clearTimeout(t);
  }, [text]);

  const stats = useMemo(() => analyzeText(debounced), [debounced]);
  const keywords = useMemo(
    () => topKeywords(debounced, { ignoreStopwords: ignoreStop, minLength: minLen }),
    [debounced, ignoreStop, minLen],
  );
  const graphemes = useMemo(() => countGraphemes(debounced), [debounced]);

  const limitMax = preset?.max ?? (parseInt(customLimit, 10) || 0);
  const limitValue = preset?.mode === "graphemes" ? graphemes : stats.charsWithSpaces;
  const overLimit = limitMax > 0 && limitValue > limitMax;
  const remaining = limitMax > 0 ? limitMax - limitValue : null;

  useEffect(() => {
    const id = setTimeout(() => {
      setAriaSummary(`${stats.words} words, ${stats.charsWithSpaces} characters`);
    }, 500);
    return () => clearTimeout(id);
  }, [stats.words, stats.charsWithSpaces]);

  function applyTransform(fn: (s: string) => string) {
    setText(fn(text));
  }

  async function copyAll() {
    const ok = await copyText(text);
    setLiveMsg(ok ? "Copied text." : "Copy failed.");
    setTimeout(() => setLiveMsg(""), 2000);
  }

  function loadTxt(file: File) {
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  const hi = (key: string) => {
    if (highlight === "all") return false;
    if (highlight === "chars") return ["graphemes", "charsWith", "charsNo"].includes(key);
    if (highlight === "time") return ["read", "speak"].includes(key);
    return false;
  };

  const formatMin = (m: number, hasWords: boolean) =>
    m < 0.1 && hasWords ? "< 1 min" : `${Math.max(0.1, m).toFixed(1)} min`;

  return (
    <div className="dt-page tool-page wc-page">
      <div className="dt-wrap">
        <DevToolHeader
          title={headerTitle}
          lead={headerLead}
          badges={["Runs in your browser", "Nothing is uploaded", "No signup"]}
        />
        <p className="wc-privacy">Runs in your browser. Nothing is uploaded or stored.</p>

        <textarea
          className="wc-textarea"
          value={text}
          placeholder="Paste or type your text here…"
          aria-label="Text to analyze"
          onChange={(e) => setText(e.target.value)}
        />

        <div className="qr-dl" style={{ marginTop: 10 }}>
          <button type="button" className="dt-btn" onClick={() => setText("")}>
            Clear
          </button>
          <button type="button" className="dt-btn" onClick={() => void copyAll()}>
            Copy text
          </button>
          <label className="dt-btn" style={{ cursor: "pointer" }}>
            Upload .txt
            <input
              type="file"
              accept=".txt,text/plain"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) loadTxt(f);
                e.target.value = "";
              }}
            />
          </label>
          <button type="button" className="dt-btn" onClick={() => applyTransform(toUpper)}>
            UPPERCASE
          </button>
          <button type="button" className="dt-btn" onClick={() => applyTransform(toLower)}>
            lowercase
          </button>
          <button type="button" className="dt-btn" onClick={() => applyTransform(toTitleCase)}>
            Title Case
          </button>
          <button type="button" className="dt-btn" onClick={() => applyTransform(toSentenceCase)}>
            Sentence case
          </button>
          <button type="button" className="dt-btn" onClick={() => applyTransform(collapseWhitespace)}>
            Trim spaces
          </button>
        </div>

        <p className="dt-status" aria-live="polite">
          {liveMsg || ariaSummary}
        </p>

        <div className="wc-stats" role="list">
          <div className={`wc-stat ${hi("words") ? "wc-stat--hi" : ""}`}>
            <dt>Words</dt>
            <dd>{stats.words}</dd>
          </div>
          <div className={`wc-stat ${hi("graphemes") ? "wc-stat--hi" : ""}`}>
            <dt>Graphemes</dt>
            <dd>{graphemes}</dd>
          </div>
          <div className={`wc-stat ${hi("charsWith") ? "wc-stat--hi" : ""}`}>
            <dt>Characters (with spaces)</dt>
            <dd>{stats.charsWithSpaces}</dd>
          </div>
          <div className={`wc-stat ${hi("charsNo") ? "wc-stat--hi" : ""}`}>
            <dt>Characters (no spaces)</dt>
            <dd>{stats.charsWithoutSpaces}</dd>
          </div>
          <div className="wc-stat">
            <dt>Sentences</dt>
            <dd>{stats.sentences}</dd>
          </div>
          <div className="wc-stat">
            <dt>Paragraphs</dt>
            <dd>{stats.paragraphs}</dd>
          </div>
          <div className="wc-stat">
            <dt>Lines</dt>
            <dd>{stats.lines}</dd>
          </div>
          <div className={`wc-stat ${hi("read") ? "wc-stat--hi" : ""}`}>
            <dt>Reading (~220 wpm)</dt>
            <dd>{formatMin(stats.readMinutes, stats.words > 0)}</dd>
          </div>
          <div className={`wc-stat ${hi("speak") ? "wc-stat--hi" : ""}`}>
            <dt>Speaking (~130 wpm)</dt>
            <dd>{formatMin(stats.speakMinutes, stats.words > 0)}</dd>
          </div>
        </div>

        <p className="qr-section-title">Character limits</p>
        <div className="ic-chips">
          {LIMIT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="ic-chip"
              aria-pressed={preset?.id === p.id}
              onClick={() => setPreset(preset?.id === p.id ? null : p)}
            >
              {p.label} ({p.max})
            </button>
          ))}
        </div>
        <label className="dt-field">
          Custom limit
          <input
            className="dt-input"
            inputMode="numeric"
            value={customLimit}
            onChange={(e) => {
              setCustomLimit(e.target.value);
              setPreset(null);
            }}
            placeholder="e.g. 500"
          />
        </label>
        {limitMax > 0 && (
          <p className={overLimit ? "wc-limit-over" : "qr-hint"}>
            {overLimit
              ? `${limitValue - limitMax} over limit (${limitMax})`
              : `${remaining} characters remaining of ${limitMax}`}
          </p>
        )}

        <p className="qr-section-title">Keyword density</p>
        <label className="dt-check">
          <input type="checkbox" checked={ignoreStop} onChange={(e) => setIgnoreStop(e.target.checked)} />
          Ignore common English stop words
        </label>
        <label className="dt-field">
          Minimum word length
          <input
            className="dt-input"
            type="number"
            min={1}
            max={20}
            value={minLen}
            onChange={(e) => setMinLen(parseInt(e.target.value, 10) || 1)}
          />
        </label>
        <div className="wc-kw">
          <table>
            <thead>
              <tr>
                <th>Word</th>
                <th>Count</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {keywords.map((k) => (
                <tr key={k.word}>
                  <td>{k.word}</td>
                  <td>{k.count}</td>
                  <td>{k.percent.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <WordLandingNav current={landing} />
      </div>
    </div>
  );
}