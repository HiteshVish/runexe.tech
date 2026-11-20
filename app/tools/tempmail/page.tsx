import type { Metadata } from "next";
import TempmailApp from "@/components/tools/TempmailApp";

export const metadata: Metadata = {
  title:
    "Free Temporary Email Generator, No Signup | Disposable Email for Testing | RunExe Technology",
  description:
    "Create a free temporary email instantly. No signup required. Perfect for testing, privacy, and quick registrations. Built by RunExe Technology.",
  icons: { icon: "/assets/runexe-logo.png" },
  alternates: { canonical: "https://runexe.tech/tools/tempmail" },
  openGraph: {
    type: "website",
    siteName: "RunExe Technology",
    title:
      "Free Temporary Email Generator, No Signup | Disposable Email for Testing | RunExe Technology",
    description:
      "Create a free temporary email instantly. No signup required. Perfect for testing, privacy, and quick registrations. Built by RunExe Technology.",
    url: "https://runexe.tech/tools/tempmail",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Free Temporary Email Generator, No Signup | Disposable Email for Testing | RunExe Technology",
    description:
      "Create a free temporary email instantly. No signup required. Perfect for testing, privacy, and quick registrations. Built by RunExe Technology.",
  },
  other: {
    "google-site-verification": "YVabcBuFugCw2Rz8gIGLJ8BOowJXjIp7NnspJBfxoi8",
  },
};

const webAppLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "RunExe Technology — Temporary Email Generator (Free, No Signup)",
  description:
    "Create a free temporary email instantly. No signup required. Perfect for testing, privacy, and quick registrations. Built by RunExe Technology.",
  url: "https://runexe.tech/tools/tempmail",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  provider: {
    "@type": "Organization",
    name: "RunExe Technology",
    url: "https://runexe.tech",
    description: "Custom software, web development, and IT consulting — RunExe Technology.",
  },
};

export default function TempmailPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppLd) }}
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <TempmailApp />
    </>
  );
}