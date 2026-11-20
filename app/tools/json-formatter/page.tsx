import type { Metadata } from "next";
import JsonFormatterApp from "@/components/tools/JsonFormatterApp";

export const metadata: Metadata = {
  title: "JSON Formatter — RunExe Technology",
  description: "Format, validate, and minify JSON in your browser. Nothing is sent to a server.",
  icons: { icon: "/assets/runexe-logo.png" },
};

export default function JsonFormatterPage() {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <JsonFormatterApp />
    </>
  );
}