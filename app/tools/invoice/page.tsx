import type { Metadata } from "next";
import { headers } from "next/headers";
import InvoiceApp from "@/components/invoice/InvoiceApp";
import { gstLookupConfig, visitorCountry } from "@/lib/invoice";

export const metadata: Metadata = {
  title: "Free Invoice Generator (International + India GST) — RunExe Technology",
  description:
    "Create professional invoices for any country — no-tax invoices for Hong Kong, VAT invoices, and GST-compliant Indian tax invoices with CGST/SGST/IGST. Live preview, multi-page PDF, free.",
  icons: { icon: "/assets/runexe-logo.png" },
  alternates: { canonical: "https://runexe.tech/tools/invoice/" },
};

type PageProps = {
  searchParams: Promise<{ country?: string }>;
};

export default async function InvoicePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const gstCfg = gstLookupConfig();
  const hdrs = await headers();
  const forwarded = hdrs.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || hdrs.get("x-real-ip");
  const vercelCountry = hdrs.get("x-vercel-ip-country");

  let country: string | null = null;
  if (sp.country && /^[A-Za-z]{2}$/.test(sp.country)) {
    country = sp.country.toUpperCase();
  } else {
    country =
      visitorCountry(ip) ||
      (vercelCountry && /^[A-Z]{2}$/.test(vercelCountry) ? vercelCountry : null);
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <InvoiceApp gstLookup={gstCfg.enabled} country={country} />
    </>
  );
}