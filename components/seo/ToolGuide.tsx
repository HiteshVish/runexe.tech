import Link from "next/link";
import { SITE_NAME, TOOLS, type ToolKey } from "@/lib/seo/site";

export type GuideSection = { heading: string; body?: string; list?: string[]; ordered?: boolean };
export type GuideFaq = { q: string; a: string };

type ToolGuideProps = {
  tool: ToolKey;
  intro?: string;
  sections?: GuideSection[];
  faq?: GuideFaq[];
};

export default function ToolGuide({ tool, intro, sections = [], faq = [] }: ToolGuideProps) {
  const related = (Object.keys(TOOLS) as ToolKey[]).filter((k) => k !== tool);
  return (
    <section className="tool-guide" aria-labelledby={`${tool}-guide-title`}>
      <div className="tg-wrap">
        {sections.length > 0 && (
          <>
            <h2 id={`${tool}-guide-title`}>About the {TOOLS[tool].name}</h2>
            {intro && <p className="tg-intro">{intro}</p>}
            <div className="tg-grid">
              {sections.map((s) => (
                <div className="tg-card" key={s.heading}>
                  <h3>{s.heading}</h3>
                  {s.body && <p>{s.body}</p>}
                  {s.list &&
                    (s.ordered ? (
                      <ol>{s.list.map((li) => <li key={li}>{li}</li>)}</ol>
                    ) : (
                      <ul>{s.list.map((li) => <li key={li}>{li}</li>)}</ul>
                    ))}
                </div>
              ))}
            </div>
          </>
        )}

        {faq.length > 0 && (
          <div className="tg-faq">
            <h2>Frequently asked questions</h2>
            {faq.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        )}

        <nav className="tg-related" aria-label="Related tools">
          <h2 id={sections.length === 0 ? `${tool}-guide-title` : undefined}>More free tools from {SITE_NAME}</h2>
          <ul>
            {related.map((k) => (
              <li key={k}>
                <Link href={TOOLS[k].path}>{TOOLS[k].name}</Link>
                <span>{TOOLS[k].summary}</span>
              </li>
            ))}
          </ul>
          <p className="tg-studio">
            These tools are built and maintained by <Link href="/">{SITE_NAME}</Link>, a software engineering studio
            for custom software, AI automation, mobile apps and cloud platforms.{" "}
            <Link href="/#contact">Start a project</Link>.
          </p>
        </nav>
      </div>
    </section>
  );
}
