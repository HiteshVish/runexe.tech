import JsonLd, { faqPage, graph, toolApp } from "@/components/seo/JsonLd";
import ToolGuide from "@/components/seo/ToolGuide";
import SpeedTestApp from "@/components/tools/SpeedTest/SpeedTestApp";
import { SPEED_TEST_DESCRIPTION, speedTestFaq, speedTestSections } from "@/lib/speed-test/tool-content";
import { SITE_URL, pageMetadata } from "@/lib/seo/site";

export const metadata = pageMetadata({
  title: "Internet Speed Test (Free) | RunExe",
  description: SPEED_TEST_DESCRIPTION,
  path: "/tools/speed-test",
});

const appLd = toolApp("speed-test", {
  description: SPEED_TEST_DESCRIPTION,
  category: "UtilitiesApplication",
  features: ["Download", "Upload", "Ping", "Jitter", "Bufferbloat", "Result PNG"],
});

export default function SpeedTestPage() {
  return (
    <>
      <JsonLd
        data={graph(
          appLd,
          faqPage(`${SITE_URL}/tools/speed-test`, speedTestFaq),
        )}
      />
      <SpeedTestApp />
      <ToolGuide tool="speed-test" intro={SPEED_TEST_DESCRIPTION} sections={speedTestSections} faq={speedTestFaq} />
    </>
  );
}
