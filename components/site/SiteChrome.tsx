"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getLenis, initSiteChrome } from "@/lib/site/site-chrome";
import { TOOLS, TOOL_KEYS } from "@/lib/seo/site";
import ToolIcon from "@/components/tools/ToolIcon";
import "@/styles/site-chrome.css";
import "lenis/dist/lenis.css";

const LINKS = [
  { href: "/#about", label: "About" },
  { href: "/#services", label: "Services" },
  { href: "/#process", label: "Process" },
  { href: "/projects", label: "Projects" },
];

const Chevron = () => (
  <svg className="nav-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

// Mounted once for the whole site, so the cursor, circuit background,
// header and smooth scrolling stay in place while pages change.
export default function SiteChrome() {
  const pathname = usePathname() || "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(pathname.startsWith("/tools"));

  useLayoutEffect(() => initSiteChrome(), []);

  useEffect(() => {
    setMenuOpen(false);
    setToolsOpen(pathname.startsWith("/tools"));
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const lenis = getLenis();
    lenis?.stop();
    document.documentElement.classList.add("mnav-lock");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    const mq = window.matchMedia("(min-width: 901px)");
    const onWide = () => mq.matches && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onWide);
    return () => {
      lenis?.start();
      document.documentElement.classList.remove("mnav-lock");
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onWide);
    };
  }, [menuOpen]);

  const current = (href: string) =>
    href.startsWith("/#") ? undefined : pathname === href || pathname.startsWith(href + "/") ? "page" : undefined;

  return (
    <>
      <canvas id="bg-canvas" aria-hidden="true" />
      <canvas id="cursor-canvas" aria-hidden="true" />
      <div id="cursor-dot" aria-hidden="true" />
      <div id="scroll-signal" aria-hidden="true">
        <div className="fill" />
        <div className="pulse" />
      </div>
      <header className={`nav${menuOpen ? " nav--menu" : ""}`} id="nav">
        <a href="/#hero" className="nav-logo" data-magnetic="true">
          <img className="logo-light" src="/assets/logo-trimmed.png" alt="RunExe Technology" />
          <img className="logo-dark" src="/assets/logo-trimmed-dark.png" alt="" aria-hidden="true" />
        </a>
        <nav aria-label="Main">
          <ul className="nav-links">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} aria-current={current(l.href)}>
                  {l.label}
                </a>
              </li>
            ))}
            <li className="nav-dd">
              <a href="/tools" className="nav-dd-trigger" aria-current={current("/tools")} aria-haspopup="true">
                Tools <Chevron />
              </a>
              <div className="nav-dd-panel">
                <div className="nav-dd-card">
                  <div className="nav-dd-head">
                    <span>Free tools</span>
                    <small>No signup · {TOOL_KEYS.filter((k) => TOOLS[k].runsIn === "browser").length} run in your browser</small>
                  </div>
                  <ul className="nav-dd-grid">
                    {TOOL_KEYS.map((k) => {
                      const t = TOOLS[k];
                      return (
                        <li key={k}>
                          <a href={t.path} className="nav-dd-item" aria-current={current(t.path)}>
                            <span className="nav-dd-icon">
                              <ToolIcon name={t.icon} />
                            </span>
                            <span className="nav-dd-text">
                              <b>{t.name}</b>
                              <small>
                                {t.category} · {t.runsIn === "browser" ? "In your browser" : "Server-assisted"}
                              </small>
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                  <a href="/tools" className="nav-dd-all">
                    View all tools <Arrow />
                  </a>
                </div>
              </div>
            </li>
          </ul>
        </nav>
        <div className="nav-right">
          <button id="theme-toggle" className="icon-btn" aria-label="Switch to dark mode" aria-pressed="false" type="button">
            <svg className="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
            </svg>
            <svg className="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 3v1.5M12 19.5V21M4.2 4.2l1.1 1.1M18.7 18.7l1.1 1.1M3 12h1.5M19.5 12H21M4.2 19.8l1.1-1.1M18.7 5.3l1.1-1.1" />
            </svg>
          </button>
          <a href="/#contact" className="btn btn--sm btn--solid nav-cta" data-magnetic="true">
            <span className="btn-fill" />
            <span className="btn-label">Start a project</span>
          </a>
          <button
            type="button"
            className="icon-btn nav-burger"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mnav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <div id="mnav" className={`mnav${menuOpen ? " is-open" : ""}`} aria-hidden={!menuOpen} inert={!menuOpen}>
        <nav className="mnav-inner" aria-label="Mobile">
          <ul className="mnav-links">
            {LINKS.map((l, i) => (
              <li key={l.href} style={{ "--i": i } as React.CSSProperties}>
                <a href={l.href} aria-current={current(l.href)} onClick={() => setMenuOpen(false)}>
                  <em>0{i + 1}</em>
                  {l.label}
                </a>
              </li>
            ))}
            <li style={{ "--i": LINKS.length } as React.CSSProperties}>
              <div className="mnav-tools-row">
                <a href="/tools" aria-current={current("/tools")} onClick={() => setMenuOpen(false)}>
                  <em>0{LINKS.length + 1}</em>
                  Tools
                </a>
                <button
                  type="button"
                  className="mnav-toggle"
                  aria-expanded={toolsOpen}
                  aria-controls="mnav-tools"
                  aria-label={toolsOpen ? "Hide tools list" : "Show tools list"}
                  onClick={() => setToolsOpen((o) => !o)}
                >
                  <Chevron />
                </button>
              </div>
              <ul id="mnav-tools" className={`mnav-tools${toolsOpen ? " is-open" : ""}`}>
                {TOOL_KEYS.map((k) => {
                  const t = TOOLS[k];
                  return (
                    <li key={k}>
                      <a href={t.path} aria-current={current(t.path)} onClick={() => setMenuOpen(false)}>
                        <span className="nav-dd-icon">
                          <ToolIcon name={t.icon} />
                        </span>
                        {t.name}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </li>
          </ul>
          <a href="/#contact" className="mnav-cta" onClick={() => setMenuOpen(false)}>
            Start a project <Arrow />
          </a>
          <p className="mnav-meta">
            <a href="mailto:info@runexe.tech">info@runexe.tech</a>
            <a href="tel:+919326809409">+91 93268 09409</a>
          </p>
        </nav>
      </div>
    </>
  );
}
