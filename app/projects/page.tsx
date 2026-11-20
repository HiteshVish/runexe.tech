import Link from "next/link";
import JsonLd, { graph } from "@/components/seo/JsonLd";
import ProjectsShowcase from "@/components/projects/ProjectsShowcase";
import PageMotion from "@/components/site/PageMotion";
import { ORG_ID, SITE_URL, WEBSITE_ID, pageMetadata } from "@/lib/seo/site";
import { PROJECTS, PROJECT_COUNTRIES, PROJECT_INDUSTRIES } from "@/lib/site/projects";
import "@/styles/showcase.css";

const description =
  "Selected work by RunExe Technology: websites and platforms for healthcare, fintech and hospitality clients in India and Hong Kong.";

export const metadata = pageMetadata({
  title: "Projects — Websites & Platforms We've Shipped | RunExe",
  description,
  path: "/projects",
});

const ld = graph({
  "@type": "CollectionPage",
  "@id": `${SITE_URL}/projects#page`,
  url: `${SITE_URL}/projects`,
  name: "Projects by RunExe Technology",
  description,
  isPartOf: { "@id": WEBSITE_ID },
  publisher: { "@id": ORG_ID },
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: PROJECTS.length,
    itemListElement: PROJECTS.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "CreativeWork",
        "@id": `${SITE_URL}/projects#${p.slug}`,
        name: p.name,
        description: p.summary,
        genre: p.category,
        image: `${SITE_URL}${p.image}`,
        creator: { "@id": ORG_ID },
        ...(p.url ? { url: p.url } : {}),
      },
    })),
  },
});

const marquee = [...new Set(PROJECTS.flatMap((p) => p.category.split(" · ")))];
const fan = PROJECTS.filter((p) => p.url).slice(0, 3);

export default function ProjectsPage() {
  return (
    <div className="sc-page tool-page" id="projects-root">
      <JsonLd data={ld} />
      <section className="sc-hero sc-hero--projects">
        <div className="sc-hero-copy">
          <div className="sc-kicker">Selected work</div>
          <h1 className="sc-title" data-split>
            Products we&apos;ve <span className="cr">shipped.</span>
          </h1>
          <p className="sc-lead">
            Platforms built by RunExe for a diagnostics lab, a private members&apos; club and fintech companies — with{" "}
            {PROJECTS.filter((p) => p.url).length} of them live on the web today.
          </p>
          <dl className="sc-stats">
            <div>
              <dt>Projects</dt>
              <dd data-count={PROJECTS.length}>{PROJECTS.length}</dd>
            </div>
            <div>
              <dt>Countries</dt>
              <dd data-count={PROJECT_COUNTRIES.length}>{PROJECT_COUNTRIES.length}</dd>
            </div>
            <div>
              <dt>Industries</dt>
              <dd data-count={PROJECT_INDUSTRIES.length}>{PROJECT_INDUSTRIES.length}</dd>
            </div>
          </dl>
        </div>

        <div className="pj-fan" aria-hidden="true">
          {fan.map((p, i) => (
            <div key={p.slug} className={`pj-fan-card pj-fan-card--${i}`}>
              <div className="pj-chrome">
                <i />
                <i />
                <i />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt="" width={1120} height={630} loading="eager" decoding="async" />
            </div>
          ))}
          <div className="sc-seal sc-seal--fan" data-stamp="-12">
            <b>Live</b>
            <span>In production</span>
            <small>RunExe · Work</small>
          </div>
        </div>
      </section>

      <div className="sc-marquee" aria-hidden="true">
        <div className="sc-marquee-track">
          {[0, 1].map((k) => (
            <span key={k}>
              {marquee.concat(marquee).map((m, i) => (
                <em key={`${k}-${i}`}>{m}</em>
              ))}
            </span>
          ))}
        </div>
      </div>

      <ProjectsShowcase projects={PROJECTS} industries={PROJECT_INDUSTRIES} />

      <section className="sc-cta" data-reveal data-spot>
        <span className="tl-glow" aria-hidden="true" />
        <div>
          <div className="sc-kicker">Your turn</div>
          <h2>Your product could be next.</h2>
          <p>Tell us what you&apos;re building. We&apos;ll reply within one business day with a point of view — not a sales script.</p>
        </div>
        <div className="sc-cta-actions">
          <Link href="/#contact" className="sc-btn sc-btn--solid">
            Start a project
          </Link>
          <Link href="/tools" className="sc-btn">
            Try our free tools
          </Link>
        </div>
      </section>

      <PageMotion rootId="projects-root" />
    </div>
  );
}
