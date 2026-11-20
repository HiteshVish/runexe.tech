import TempmailApp from "@/components/tools/TempmailApp";
import JsonLd, { graph, toolApp } from "@/components/seo/JsonLd";
import ToolGuide from "@/components/seo/ToolGuide";
import { pageMetadata } from "@/lib/seo/site";

const description =
  "Create a free temporary email instantly. No signup. Disposable inbox for testing, privacy and quick registrations. Built by RunExe Technology.";

export const metadata = pageMetadata({
  title: "Free Temporary Email Generator (No Signup) | RunExe",
  description,
  path: "/tools/tempmail",
});

const appLd = toolApp("tempmail", {
  description,
  category: "DeveloperApplication",
  features: [
    "Generate a disposable email address without signing up",
    "Real inbox with refresh",
    "HTML and plain-text message views",
    "SPF and DKIM results per message",
    "Attachment and .eml downloads",
  ],
});

export default function TempmailPage() {
  return (
    <>
      <JsonLd data={graph(appLd)} />
      <TempmailApp />
      <ToolGuide tool="tempmail" />
    </>
  );
}
