"use client";

import { useEffect, useRef } from "react";
import { initRunexeHome } from "@/lib/home/runexe-home";
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

    const cleanup = initRunexeHome();

    return () => {
      cleanup();
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
