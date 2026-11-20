"use client";

import { useEffect, useRef } from "react";
import tempmailBody from "@/lib/tempmail/tempmail-body";
import { initTempmail } from "@/lib/tempmail/tempmail-app";
import "@/styles/tempmail.css";

export default function TempmailApp() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.innerHTML = tempmailBody;
    const cleanup = initTempmail();
    return () => {
      cleanup();
      root.innerHTML = "";
    };
  }, []);

  return <div ref={rootRef} className="tool-page" suppressHydrationWarning />;
}