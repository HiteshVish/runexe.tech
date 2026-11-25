"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import type { StudioMode } from "@/lib/pdf-studio/constants";
import { usePdfStore } from "@/lib/pdf-studio/store";
import "@/styles/pdf-studio.css";
import UploadLanding from "./UploadLanding";

const Workspace = dynamic(() => import("./Workspace/Workspace"), {
  ssr: false,
  loading: () => (
    <div className="ps-page">
      <p>Loading editor…</p>
    </div>
  ),
});

export type PdfStudioAppProps = {
  headerTitle?: string;
  headerLead?: string;
  initialMode?: StudioMode;
};

export default function PdfStudioApp({
  headerTitle = "Free Online PDF Editor",
  headerLead = "Edit, organize, merge, split and sign PDF documents in your browser. Nothing is uploaded.",
  initialMode = "editor",
}: PdfStudioAppProps) {
  const session = usePdfStore((s) => s.session);
  const setMode = usePdfStore((s) => s.setMode);
  const setTool = usePdfStore((s) => s.setTool);

  useEffect(() => {
    if (session && session.mode !== initialMode) setMode(initialMode);
  }, [initialMode, session, setMode]);

  useEffect(() => {
    if (!session) return;
    if (initialMode === "add-text") setTool("text");
    if (initialMode === "sign") setTool("signature");
    if (initialMode === "rotate" || initialMode === "organize" || initialMode === "remove-pages") setTool("select");
  }, [initialMode, session, setTool]);

  const hasDoc = session && session.pageOrder.length > 0 && !session.error;

  return hasDoc ? (
    <Workspace />
  ) : (
    <UploadLanding title={headerTitle} lead={headerLead} mode={initialMode} />
  );
}