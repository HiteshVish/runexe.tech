import { ogContentType, ogSize, renderOgImage } from "@/lib/seo/og-image";

export const alt = "Free online tools for developers and businesses by RunExe";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    kicker: "Free tools · No signup",
    title: "Free tools, built to execute.",
    subtitle: "Invoices, temp mail, JSON, Base64, JWT, UUID and SHA hashes.",
  });
}
