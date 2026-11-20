"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ToolIcon from "@/components/tools/ToolIcon";
import type { Tool, ToolCategory, ToolKey } from "@/lib/seo/site";

type Entry = Tool & { key: ToolKey };
const CATEGORIES: ("All" | ToolCategory)[] = ["All", "Developer", "Business", "Privacy"];

export default function ToolsDirectory({ tools }: { tools: Entry[] }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return new Set(
      tools
        .filter((t) => cat === "All" || t.category === cat)
        .filter((t) => !q || [t.name, t.summary, t.category, ...t.tags].join(" ").toLowerCase().includes(q))
        .map((t) => t.key),
    );
  }, [tools, query, cat]);

  useEffect(() => {
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [visible]);

  const counts = useMemo(
    () => Object.fromEntries(CATEGORIES.map((c) => [c, c === "All" ? tools.length : tools.filter((t) => t.category === c).length])),
    [tools],
  );

  return (
    <section className="sc-section" aria-labelledby="all-tools">
      <h2 id="all-tools" className="sr-only">
        All tools
      </h2>
      <div className="sc-toolbar" data-reveal>
        <label className="sc-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={search}
            type="search"
            placeholder="Search tools — try “GST”, “token” or “SHA”"
            aria-label="Search tools"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd aria-hidden="true">/</kbd>
        </label>
        <div className="sc-chips" role="group" aria-label="Filter by category">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" className="sc-chip" aria-pressed={cat === c} onClick={() => setCat(c)}>
              {c}
              <span>{counts[c]}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="sc-result" role="status" aria-live="polite">
        {visible.size === tools.length ? `${tools.length} tools` : `${visible.size} of ${tools.length} tools`}
      </p>

      <div className="tl-grid">
        {tools.map((t, i) => (
          <Link
            key={t.key}
            href={t.path}
            className={`tl-card${i === 0 ? " tl-card--feature" : ""}`}
            hidden={!visible.has(t.key)}
            data-reveal
            data-spot
            data-tilt="5"
          >
            <span className="tl-glow" aria-hidden="true" />
            <div className="tl-top">
              <span className="tl-icon">
                <ToolIcon name={t.icon} />
              </span>
              <span className={`tl-run tl-run--${t.runsIn}`}>
                {t.runsIn === "browser" ? "Runs in your browser" : "Server-assisted"}
              </span>
            </div>
            <div className="tl-cat">{t.category}</div>
            <h3>{t.name}</h3>
            <p>{t.summary}</p>
            {i === 0 && (
              <div className="tl-mock" aria-hidden="true">
                <div className="tl-mock-head">
                  <b>INVOICE</b>
                  <i />
                </div>
                <div className="tl-mock-line m" />
                <div className="tl-mock-line s" />
                <div className="tl-mock-row h">
                  <span />
                  <span />
                  <span />
                </div>
                {[0, 1, 2, 3].map((r) => (
                  <div className="tl-mock-row" key={r}>
                    <span />
                    <span />
                    <span />
                  </div>
                ))}
                <div className="tl-mock-total">
                  <span>TOTAL</span>
                  <span>₹ 24,780</span>
                </div>
                <span className="tl-mock-stamp">PAID</span>
              </div>
            )}
            {i === 0 && (
              <ul className="tl-feature-list" aria-label="Highlights">
                <li>No tax, VAT, India GST and export invoices</li>
                <li>Four designs with a live preview</li>
                <li>Multi-page PDF download</li>
              </ul>
            )}
            <div className="tl-tags">
              {t.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <div className="tl-open">
              Open tool
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {visible.size === 0 && (
        <div className="sc-empty">
          No tool matches “{query}”.{" "}
          <button type="button" onClick={() => { setQuery(""); setCat("All"); }}>
            Show all tools
          </button>
        </div>
      )}
    </section>
  );
}
