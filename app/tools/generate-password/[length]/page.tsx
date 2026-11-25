import type { Metadata } from "next";
import PasswordGeneratorApp from "@/components/tools/PasswordGenerator/PasswordGeneratorApp";
import JsonLd, { faqPage, graph, toolApp } from "@/components/seo/JsonLd";
import ToolGuide from "@/components/seo/ToolGuide";
import {
  PASSWORD_LENGTHS,
  isPasswordLength,
  passwordLandingMeta,
  type PasswordLengthSlug,
} from "@/lib/password/length-landings";
import { PASSWORD_DESCRIPTION, passwordFaq, passwordSections } from "@/lib/password/tool-content";
import { SITE_URL, pageMetadata } from "@/lib/seo/site";

type Props = { params: Promise<{ length: string }> };

export function generateStaticParams() {
  return PASSWORD_LENGTHS.map((length) => ({ length: String(length) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { length } = await params;
  if (!isPasswordLength(length)) {
    return pageMetadata({
      title: "Password Generator | RunExe",
      description: PASSWORD_DESCRIPTION,
      path: "/tools/password-generator",
    });
  }
  const meta = passwordLandingMeta(parseInt(length, 10) as PasswordLengthSlug);
  return pageMetadata({ title: meta.title, description: meta.description, path: meta.path });
}

export default async function GeneratePasswordLengthPage({ params }: Props) {
  const { length } = await params;
  if (!isPasswordLength(length)) {
    return <PasswordGeneratorApp />;
  }
  const n = parseInt(length, 10) as PasswordLengthSlug;
  const meta = passwordLandingMeta(n);
  const appLd = toolApp("password-generator", {
    description: meta.description,
    category: "UtilitiesApplication",
    features: [`${n}-character passwords`, "crypto.getRandomValues"],
  });

  return (
    <>
      <JsonLd data={graph(appLd, faqPage(`${SITE_URL}${meta.path}`, passwordFaq))} />
      <PasswordGeneratorApp
        headerTitle={meta.h1}
        headerLead={meta.lead}
        initialLength={meta.initialLength}
        currentLengthLanding={n}
      />
      <ToolGuide tool="password-generator" intro={meta.lead} sections={passwordSections} faq={passwordFaq} />
    </>
  );
}