import type { Metadata } from "next";
import ImageCompressorApp from "@/components/tools/ImageCompressor/ImageCompressorApp";
import JsonLd, { faqPage, graph, toolApp } from "@/components/seo/JsonLd";
import ToolGuide from "@/components/seo/ToolGuide";
import {
  IMAGE_COMPRESSOR_DESCRIPTION,
  imageCompressorFaq,
  imageCompressorSections,
} from "@/lib/image/tool-content";
import {
  COMPRESS_TARGET_SLUGS,
  TARGET_BYTES,
  isCompressTargetSlug,
  landingMeta,
  type CompressTargetSlug,
} from "@/lib/image/target-sizes";
import { SITE_URL, pageMetadata } from "@/lib/seo/site";

type Props = { params: Promise<{ size: string }> };

export function generateStaticParams() {
  return COMPRESS_TARGET_SLUGS.map((size) => ({ size }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { size } = await params;
  if (!isCompressTargetSlug(size)) {
    return pageMetadata({
      title: "Compress Image Online | RunExe",
      description: IMAGE_COMPRESSOR_DESCRIPTION,
      path: "/tools/image-compressor",
    });
  }
  const meta = landingMeta(size);
  return pageMetadata({
    title: meta.title,
    description: meta.description,
    path: meta.path,
  });
}

export default async function CompressImageToPage({ params }: Props) {
  const { size } = await params;
  if (!isCompressTargetSlug(size)) {
    return (
      <ImageCompressorApp
        headerTitle="Image Compressor"
        headerLead={IMAGE_COMPRESSOR_DESCRIPTION}
      />
    );
  }

  const meta = landingMeta(size as CompressTargetSlug);
  const bytes = TARGET_BYTES[size as CompressTargetSlug];
  const appLd = toolApp("image-compressor", {
    description: meta.description,
    category: "MultimediaApplication",
    features: [`Compress images to about ${meta.title}`, "Browser-only processing"],
  });

  return (
    <>
      <JsonLd data={graph(appLd, faqPage(`${SITE_URL}${meta.path}`, imageCompressorFaq))} />
      <ImageCompressorApp
        headerTitle={meta.h1}
        headerLead={meta.lead}
        initialCompressionMode="target"
        initialTargetBytes={bytes}
        landingSlug={size as CompressTargetSlug}
      />
      <ToolGuide
        tool="image-compressor"
        intro={`Free online tool to compress images to about ${meta.h1.replace(/^Compress image to /i, "")} — no upload required.`}
        sections={imageCompressorSections}
        faq={imageCompressorFaq}
      />
    </>
  );
}