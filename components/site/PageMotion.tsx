"use client";

import { useEffect } from "react";
import { initPageMotion } from "@/lib/site/page-motion";

/** Runs the shared page animations over the element with the given id. */
export default function PageMotion({ rootId }: { rootId: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    return root ? initPageMotion(root) : undefined;
  }, [rootId]);
  return null;
}
