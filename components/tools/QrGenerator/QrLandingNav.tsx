import Link from "next/link";
import { QR_LANDING_SLUGS, qrLandingMeta, type QrLandingSlug } from "@/lib/qr/landing-meta";

type Props = { currentLanding?: QrLandingSlug };

export default function QrLandingNav({ currentLanding }: Props) {
  return (
    <aside className="qr-landing-nav">
      <p>Specialized QR generators</p>
      <nav aria-label="QR tool variants">
        <Link href="/tools/qr-code-generator" aria-current={!currentLanding ? "page" : undefined}>
          All-in-one QR generator
        </Link>
        <Link href="/tools/image-compressor">Image Compressor</Link>
        <Link href="/tools/password-generator">Password Generator</Link>
        <Link href="/tools/word-counter">Word Counter</Link>
        {QR_LANDING_SLUGS.map((slug) => {
          const m = qrLandingMeta(slug);
          return (
            <Link key={slug} href={m.path} aria-current={currentLanding === slug ? "page" : undefined}>
              {m.h1}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}