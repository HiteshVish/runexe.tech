"use client";

import { useLayoutEffect } from "react";
import { initSiteChrome } from "@/lib/site/site-chrome";
import "@/styles/site-chrome.css";
import "lenis/dist/lenis.css";

// Mounted once for the whole site, so the cursor, circuit background,
// header and smooth scrolling stay in place while pages change.
export default function SiteChrome() {
  useLayoutEffect(() => initSiteChrome(), []);

  return (
    <>
      <canvas id="bg-canvas" aria-hidden="true" />
      <canvas id="cursor-canvas" aria-hidden="true" />
      <div id="cursor-dot" aria-hidden="true" />
      <div id="scroll-signal" aria-hidden="true">
        <div className="fill" />
        <div className="pulse" />
      </div>
      <header className="nav" id="nav">
        <a href="/#hero" className="nav-logo" data-magnetic="true">
          <img className="logo-light" src="/assets/logo-trimmed.png" alt="RunExe Technology" />
          <img className="logo-dark" src="/assets/logo-trimmed-dark.png" alt="" aria-hidden="true" />
        </a>
        <ul className="nav-links">
          <li><a href="/#about">About</a></li>
          <li><a href="/#services">Services</a></li>
          <li><a href="/#process">Process</a></li>
          <li><a href="/#work">Work</a></li>
          <li><a href="/#tools">Tools</a></li>
        </ul>
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
          <a href="/#contact" className="btn btn--sm btn--solid" data-magnetic="true">
            <span className="btn-fill" />
            <span className="btn-label">Start a project</span>
          </a>
        </div>
      </header>
    </>
  );
}
