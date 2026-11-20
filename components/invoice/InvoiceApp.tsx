"use client";

import { useEffect, useRef } from "react";
import invoiceBody from "@/lib/invoice-ui/invoice-body";
import { initInvoiceApp } from "@/lib/invoice-ui/invoice-app";
import "@/styles/invoice.css";

type InvoiceAppProps = {
  gstLookup: boolean;
  country: string | null;
};

export default function InvoiceApp({ gstLookup, country }: InvoiceAppProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    (window as unknown as { INVOICE_CONFIG?: { gstLookup: boolean; country: string | null } }).INVOICE_CONFIG =
      { gstLookup, country };

    root.innerHTML = invoiceBody;
    const cleanup = initInvoiceApp();

    return () => {
      cleanup();
      root.innerHTML = "";
    };
  }, [gstLookup, country]);

  return <div ref={rootRef} className="tool-page" suppressHydrationWarning />;
}