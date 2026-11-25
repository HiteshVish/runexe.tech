"use client";

import { useEffect, useRef } from "react";
import homeBody from "@/lib/home/home-body";
import "@/styles/home.css";
import "lenis/dist/lenis.css";

// The markup is a constant string, so the server and the client always render
// the same HTML and the page is visible before any script has run.
const markup = { __html: homeBody };

export default function HomePage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    // Load after mount in its own chunk so Turbopack HMR never keeps a stale
    // edge to removed deps (e.g. three.js from an earlier port).
    void import("@/lib/home/runexe-home").then(({ initRunexeHome }) => {
      if (disposed) return;
      cleanup = initRunexeHome();
    });

    return () => {
      disposed = true;
      cleanup?.();
      // The script rewrites parts of the DOM (split text, marquee copies,
      // inline styles). Put the original markup back so a re-mount starts clean.
      root.innerHTML = homeBody;
    };
  }, []);

  return (
    <div
      ref={rootRef}
      id="runexe-home-root"
      suppressHydrationWarning
      dangerouslySetInnerHTML={markup}
    />
  );
}
