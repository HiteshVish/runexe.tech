"use client";

import { useEffect, useRef } from "react";
import tempmailBody from "@/lib/tempmail/tempmail-body";
import { initTempmail } from "@/lib/tempmail/tempmail-app";
import "@/styles/tempmail.css";

// Constant markup, so the server and client render the same HTML and the
// tool's headings and guide are readable before any script runs.
const markup = { __html: tempmailBody };

export default function TempmailApp() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cleanup = initTempmail();
    return () => {
      cleanup();
      // The script rewrites parts of the DOM; restore it so a re-mount starts clean.
      root.innerHTML = tempmailBody;
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="tool-page"
      suppressHydrationWarning
      dangerouslySetInnerHTML={markup}
    />
  );
}
