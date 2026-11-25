import Link from "next/link";
import { PASSWORD_LENGTHS, type PasswordLengthSlug } from "@/lib/password/length-landings";

type Props = { currentLength?: PasswordLengthSlug };

export default function LengthLandingNav({ currentLength }: Props) {
  return (
    <aside className="qr-landing-nav">
      <p>Generate by length</p>
      <nav aria-label="Password lengths">
        <Link href="/tools/password-generator" aria-current={!currentLength ? "page" : undefined}>
          All options
        </Link>
        {PASSWORD_LENGTHS.map((n) => (
          <Link
            key={n}
            href={`/tools/generate-password/${n}`}
            aria-current={currentLength === n ? "page" : undefined}
          >
            {n} characters
          </Link>
        ))}
      </nav>
    </aside>
  );
}