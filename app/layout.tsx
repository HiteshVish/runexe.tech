import type { Metadata } from "next";
import { ThemeScript } from "@/components/ThemeScript";
import SiteChrome from "@/components/site/SiteChrome";

export const metadata: Metadata = {
  title: "RunExe Technology — Software Engineering Studio",
  description:
    "RunExe Technology builds custom software, AI automation, mobile apps, cloud platforms and digital products. Engineering that executes.",
  icons: { icon: "/assets/runexe-logo.png" },
  other: {
    "google-site-verification": "sxFMYH7jXcunUuM1izeLppnEMW5FXzaqIQE2SMRFzgE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <ThemeScript />
      </head>
      <body suppressHydrationWarning>
        <SiteChrome />
        {children}
      </body>
    </html>
  );
}