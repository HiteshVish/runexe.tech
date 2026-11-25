import Link from "next/link";
import { WORD_LANDING_PATHS } from "@/lib/text/landing-meta";

type Props = { current?: keyof typeof WORD_LANDING_PATHS };

export default function WordLandingNav({ current = "word-counter" }: Props) {
  return (
    <aside className="qr-landing-nav">
      <p>Word &amp; character tools</p>
      <nav aria-label="Text counter variants">
        <Link href={WORD_LANDING_PATHS["word-counter"]} aria-current={current === "word-counter" ? "page" : undefined}>
          Word counter
        </Link>
        <Link
          href={WORD_LANDING_PATHS["character-counter"]}
          aria-current={current === "character-counter" ? "page" : undefined}
        >
          Character counter
        </Link>
        <Link
          href={WORD_LANDING_PATHS["reading-time-calculator"]}
          aria-current={current === "reading-time-calculator" ? "page" : undefined}
        >
          Reading time
        </Link>
      </nav>
    </aside>
  );
}