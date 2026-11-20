import { ogContentType, ogSize, renderOgImage } from "@/lib/seo/og-image";

export const alt = "Free invoice generator with GST and VAT by RunExe";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    kicker: "Free tool",
    title: "Invoice Generator",
    subtitle: "No tax, VAT and India GST invoices. Live preview and PDF download.",
  });
}
