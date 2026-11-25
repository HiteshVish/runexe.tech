import PasswordGeneratorApp from "@/components/tools/PasswordGenerator/PasswordGeneratorApp";
import JsonLd, { faqPage, graph, toolApp } from "@/components/seo/JsonLd";
import ToolGuide from "@/components/seo/ToolGuide";
import { PASSWORD_DESCRIPTION, passwordFaq, passwordSections } from "@/lib/password/tool-content";
import { SITE_URL, pageMetadata } from "@/lib/seo/site";

export const metadata = pageMetadata({
  title: "Free Password Generator (Secure, No Signup) | RunExe",
  description: PASSWORD_DESCRIPTION,
  path: "/tools/password-generator",
});

const appLd = toolApp("password-generator", {
  description: PASSWORD_DESCRIPTION,
  category: "UtilitiesApplication",
  features: ["Random passwords", "Passphrases", "Strength meter", "Browser-only crypto"],
});

export default function PasswordGeneratorPage() {
  return (
    <>
      <JsonLd data={graph(appLd, faqPage(`${SITE_URL}/tools/password-generator`, passwordFaq))} />
      <PasswordGeneratorApp />
      <ToolGuide tool="password-generator" intro={PASSWORD_DESCRIPTION} sections={passwordSections} faq={passwordFaq} />
    </>
  );
}