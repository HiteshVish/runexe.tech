import Link from "next/link";
import JsonLd, { graph } from "@/components/seo/JsonLd";
import PageMotion from "@/components/site/PageMotion";
import ToolIcon from "@/components/tools/ToolIcon";
import ToolsDirectory from "@/components/tools/ToolsDirectory";
import { ORG_ID, SITE_URL, TOOLS, TOOL_KEYS, WEBSITE_ID, pageMetadata } from "@/lib/seo/site";
import "@/styles/showcase.css";

const description =
  "Free online tools from RunExe Technology: invoice generator, PDF Studio, temp mail, JSON formatter, image compressor, QR and password generators, word counter, and more. No signup.";

export const metadata = pageMetadata({
  title: "Free Online Tools for Developers & Businesses | RunExe",
  description,
  path: "/tools",
});

const tools = TOOL_KEYS.map((key) => ({ key, ...TOOLS[key] }));
const inBrowser = tools.filter((t) => t.runsIn === "browser").length;

const ld = graph({
  "@type": "CollectionPage",
  "@id": `${SITE_URL}/tools#page`,
  url: `${SITE_URL}/tools`,
  name: "Free tools by RunExe Technology",
  description,
  isPartOf: { "@id": WEBSITE_ID },
  publisher: { "@id": ORG_ID },
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: tools.length,
    itemListElement: tools.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}${t.path}`,
      name: t.name,
    })),
  },
});

export default function ToolsPage() {
  return (
    <div className="sc-page tool-page" id="tools-root">
      <JsonLd data={ld} />
      <section className="sc-hero">
        <div className="sc-hero-copy">
          <div className="sc-kicker">Free tools · No signup</div>
          <h1 className="sc-title" data-split>
            Free tools, built to <span className="cr">execute.</span>
          </h1>
          <p className="sc-lead">
            The small utilities our engineers reach for every day, polished and shared. Make an invoice, test an email
            flow, or inspect a token, hash and payload without installing anything.
          </p>
          <dl className="sc-stats">
            <div>
              <dt>Live tools</dt>
              <dd data-count={tools.length}>{tools.length}</dd>
            </div>
            <div>
              <dt>Run in your browser</dt>
              <dd data-count={inBrowser}>{inBrowser}</dd>
            </div>
            <div>
              <dt>Accounts needed</dt>
              <dd>0</dd>
            </div>
          </dl>
        </div>

        <div className="sc-orbit" aria-hidden="true">
          <div className="sc-orbit-ring sc-orbit-ring--outer">
            {tools.map((t, i) => (
              <span
                key={t.key}
                className="sc-orbit-item"
                style={{ "--a": `${(360 / tools.length) * i}deg` } as React.CSSProperties}
              >
                <span>
                  <ToolIcon name={t.icon} />
                </span>
              </span>
            ))}
          </div>
          <div className="sc-orbit-ring sc-orbit-ring--inner" />
          <div className="sc-seal" data-stamp="-10">
            <b>Free</b>
            <span>No signup</span>
            <small>RunExe · Tools</small>
          </div>
        </div>
      </section>

      <ToolsDirectory tools={tools} />

      <section className="sc-cta" data-reveal data-spot>
        <span className="tl-glow" aria-hidden="true" />
        <div>
          <div className="sc-kicker">Built by RunExe</div>
          <h2>Need a custom internal tool?</h2>
          <p>
            Invoicing flows, admin dashboards, data converters, approval pipelines — we build the tools your team
            actually needs.
          </p>
        </div>
        <div className="sc-cta-actions">
          <Link href="/#contact" className="sc-btn sc-btn--solid">
            Start a project
          </Link>
          <Link href="/projects" className="sc-btn">
            See our work
          </Link>
        </div>
      </section>

      <PageMotion rootId="tools-root" />
    </div>
  );
}
