import HomePage from "@/components/home/HomePage";
import JsonLd, { faqPage, graph, organization, website } from "@/components/seo/JsonLd";
import { HOME_FAQ, SITE_URL, pageMetadata } from "@/lib/seo/site";

export const metadata = pageMetadata({
  title: "RunExe Technology | Custom Software & AI Studio",
  description:
    "RunExe Technology is a software engineering studio building custom platforms, AI automation, mobile apps and cloud products.",
  path: "/",
});

export default function Page() {
  return (
    <>
      <JsonLd
        data={graph(organization, website, {
          ...faqPage(`${SITE_URL}/`, HOME_FAQ),
          isPartOf: { "@id": `${SITE_URL}/#website` },
        })}
      />
      <HomePage />
    </>
  );
}
