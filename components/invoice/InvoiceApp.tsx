"use client";

import { useEffect, useRef } from "react";
import invoiceBody from "@/lib/invoice-ui/invoice-body";
import { initInvoiceApp } from "@/lib/invoice-ui/invoice-app";
import "@/styles/invoice.css";

type InvoiceAppProps = {
  gstLookup: boolean;
  country: string | null;
};

// Constant markup, so the server and client render the same HTML and the
// form headings are readable before any script runs.
const markup = { __html: invoiceBody };

export default function InvoiceApp({ gstLookup, country }: InvoiceAppProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    (window as unknown as { INVOICE_CONFIG?: { gstLookup: boolean; country: string | null } }).INVOICE_CONFIG =
      { gstLookup, country };

    const cleanup = initInvoiceApp();

    return () => {
      cleanup();
      // The script rewrites parts of the DOM; restore it so a re-mount starts clean.
      root.innerHTML = invoiceBody;
    };
  }, [gstLookup, country]);

  return (
    <div
      ref={rootRef}
      className="tool-page"
      suppressHydrationWarning
      dangerouslySetInnerHTML={markup}
    />
  );
}
