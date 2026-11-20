import { headers } from "next/headers";
import InvoiceApp from "@/components/invoice/InvoiceApp";
import JsonLd, { faqPage, graph, toolApp } from "@/components/seo/JsonLd";
import ToolGuide, { type GuideFaq, type GuideSection } from "@/components/seo/ToolGuide";
import { gstLookupConfig, visitorCountry } from "@/lib/invoice";
import { SITE_URL, pageMetadata } from "@/lib/seo/site";

const description =
  "Create professional invoices with no tax, VAT or India GST (CGST/SGST/IGST). Live preview, 10 currencies and free multi-page PDF download.";

export const metadata = pageMetadata({
  title: "Free Invoice Generator — GST, VAT & International | RunExe",
  description,
  path: "/tools/invoice",
});

const sections: GuideSection[] = [
  {
    heading: "What it does",
    body: "The RunExe Invoice Generator builds a complete invoice from a form, shows a live preview as you type, and downloads it as an A4 PDF that can run across several pages. There is no account or signup.",
  },
  {
    heading: "Who it is for",
    list: [
      "Freelancers and consultants billing clients in India or abroad",
      "Small businesses that need GST-compliant tax invoices",
      "Companies issuing VAT invoices or invoices with no tax",
      "Indian exporters invoicing under LUT or with IGST paid",
    ],
  },
  {
    heading: "Supported invoice types",
    list: [
      "No tax — for example Hong Kong invoices",
      "VAT / other tax — your own tax name and rates",
      "India GST — CGST + SGST (or UTGST) within a state, IGST across states, with GSTIN validation and place of supply",
      "India export — overseas client, under LUT with 0% IGST (LUT ARN required) or with IGST paid",
    ],
  },
  {
    heading: "How to use it",
    ordered: true,
    list: [
      "Choose the invoice type and currency.",
      "Fill in your business, the client, and the line items.",
      "Add charges, payment details, notes, terms, a logo and a signature if you need them.",
      "Pick one of four designs: Classic, Modern, Sidebar or Minimal.",
      "Check the live preview and fix any issues it lists, then download the PDF.",
    ],
  },
  {
    heading: "Key features",
    list: [
      "Ten currencies: HKD, USD, INR, EUR, GBP, SGD, AED, CNY, AUD and CAD",
      "GST rates from 0% to 40%",
      "Live preview with validation messages",
      "Multi-page PDF download",
      "Optional: remember your business details on this device",
      "Load a sample invoice to see every field filled in",
    ],
  },
  {
    heading: "Privacy and data handling",
    body: "Invoice details are sent to the runexe.tech server only to render the preview and the PDF; the tool does not store invoices in a database. If “Remember on this device” is ticked, your business profile is saved in your own browser’s local storage, and you can clear it at any time.",
  },
  {
    heading: "Limitations",
    list: [
      "This is a document tool, not tax advice. Confirm the right tax treatment and rates for your business.",
      "Automatic GSTIN detail lookup is only available when it is enabled on the server.",
      "JavaScript is required for the form, preview and PDF download.",
    ],
  },
];

const faq: GuideFaq[] = [
  {
    q: "Is the invoice generator free?",
    a: "Yes. You can create, preview and download invoices as PDFs without paying or signing up.",
  },
  {
    q: "Can I create a GST invoice with CGST, SGST and IGST?",
    a: "Yes. Choose India GST. The tool uses the place of supply to apply CGST + SGST (or UTGST) for supplies within a state, and IGST for supplies between states. It also validates the client's GSTIN.",
  },
  {
    q: "Can I make an export invoice under LUT?",
    a: "Yes. Choose India export and select Under LUT. IGST is shown at 0% and the LUT ARN is printed on the invoice. You can also choose to pay IGST instead.",
  },
  {
    q: "Can I create a VAT invoice or an invoice with no tax?",
    a: "Yes. Use VAT / other tax to set the tax name (for example VAT) and rate, or No tax for invoices without tax lines.",
  },
  {
    q: "Which currencies are supported?",
    a: "HKD, USD, INR, EUR, GBP, SGD, AED, CNY, AUD and CAD.",
  },
];

const appLd = toolApp("invoice", {
  description,
  category: "BusinessApplication",
  features: [
    "No-tax, VAT/custom tax and India GST invoices",
    "CGST, SGST, UTGST and IGST with place of supply",
    "Export invoices under LUT or with IGST",
    "Ten currencies",
    "Four invoice designs",
    "Live preview and multi-page PDF download",
  ],
});

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
      <JsonLd data={graph(appLd, faqPage(`${SITE_URL}/tools/invoice`, faq))} />
      <InvoiceApp gstLookup={gstCfg.enabled} country={country} />
      <ToolGuide
        tool="invoice"
        intro="A free invoice maker for international, VAT and India GST invoices, from RunExe Technology."
        sections={sections}
        faq={faq}
      />
    </>
  );
}
