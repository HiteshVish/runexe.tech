"use client";

import dynamic from "next/dynamic";
import type { PdfStudioAppProps } from "./PdfStudioApp";

const PdfStudioApp = dynamic(() => import("./PdfStudioApp"), {
  ssr: false,
  loading: () => (
    <div className="ps-page" style={{ padding: 24 }}>
      <p>Loading PDF Studio…</p>
    </div>
  ),
});

export default function PdfStudioClient(props: PdfStudioAppProps) {
  return <PdfStudioApp {...props} />;
}