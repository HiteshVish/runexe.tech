import Link from "next/link";
import { COMPRESS_TARGET_SLUGS, TARGET_LABELS, type CompressTargetSlug } from "@/lib/image/target-sizes";

type Props = { currentSlug?: CompressTargetSlug };

export default function TargetSizeNav({ currentSlug }: Props) {
  return (
    <aside className="ic-target-nav">
      <p>Compress to a specific size</p>
      <nav aria-label="Target file sizes">
        <Link href="/tools/image-compressor">All-in-one tool</Link>
        <Link href="/tools/qr-code-generator">QR Code Generator</Link>
        <Link href="/tools/password-generator">Password Generator</Link>
        <Link href="/tools/word-counter">Word Counter</Link>
        {COMPRESS_TARGET_SLUGS.map((slug) => (
          <Link
            key={slug}
            href={`/tools/compress-image-to/${slug}`}
            aria-current={currentSlug === slug ? "page" : undefined}
          >
            {TARGET_LABELS[slug]}
          </Link>
        ))}
      </nav>
    </aside>
  );
}