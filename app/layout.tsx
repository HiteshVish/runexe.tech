import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Sora } from "next/font/google";
import { ThemeScript } from "@/components/ThemeScript";
import SiteChrome from "@/components/site/SiteChrome";
import SiteFooter from "@/components/site/SiteFooter";
import { SITE_NAME, SITE_URL, SHORT_NAME } from "@/lib/seo/site";

const sora = Sora({ subsets: ["latin"], display: "swap", variable: "--font-sora" });
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
// Only the invoice and JSON tools use the mono face, so it is not preloaded on every page.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
  variable: "--font-plex-mono",
});

const bingVerification = process.env.BING_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Custom Software & AI Studio`,
    template: `%s | ${SHORT_NAME}`,
  },
  description:
    "RunExe Technology is a software engineering studio building custom platforms, AI automation, mobile apps and cloud products.",
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  icons: {
    icon: "/assets/runexe-logo.png",
    apple: "/assets/runexe-logo.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
  verification: {
    google: ["sxFMYH7jXcunUuM1izeLppnEMW5FXzaqIQE2SMRFzgE", "YVabcBuFugCw2Rz8gIGLJ8BOowJXjIp7NnspJBfxoi8"],
    ...(bingVerification ? { other: { "msvalidate.01": bingVerification } } : {}),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${inter.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="light dark" />
        <ThemeScript />
      </head>
      <body suppressHydrationWarning>
        <SiteChrome />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}