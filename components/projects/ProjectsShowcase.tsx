"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Project } from "@/lib/site/projects";

function host(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export default function ProjectsShowcase({ projects, industries }: { projects: Project[]; industries: string[] }) {
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [filter]);

  const chips = ["All", ...industries];

  return (
    <section className="sc-section" aria-labelledby="project-list">
      <h2 id="project-list" className="sr-only">
        Projects
      </h2>
      <div className="sc-toolbar" data-reveal>
        <div className="sc-chips" role="group" aria-label="Filter by industry">
          {chips.map((c) => (
            <button key={c} type="button" className="sc-chip" aria-pressed={filter === c} onClick={() => setFilter(c)}>
              {c}
              <span>{c === "All" ? projects.length : projects.filter((p) => p.industry === c).length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pj-list">
        {projects.map((p, i) => (
          <article
            key={p.slug}
            id={p.slug}
            className={`pj-item${i % 2 ? " pj-item--flip" : ""}`}
            hidden={filter !== "All" && p.industry !== filter}
            aria-labelledby={`${p.slug}-name`}
          >
            <div className="pj-media" data-reveal>
              <div className="pj-frame" data-tilt="4" data-spot>
                <div className="pj-chrome" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <span className="pj-addr">{p.url ? host(p.url) : "Private build"}</span>
                </div>
                <div className="pj-shot" data-parallax>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={p.imageAlt} width={1120} height={630} loading={i === 0 ? "eager" : "lazy"} decoding="async" />
                </div>
                <span className="tl-glow" aria-hidden="true" />
              </div>
              <span className="pj-stamp" data-stamp={i % 2 ? "7" : "-7"} aria-hidden="true">
                <b>Shipped</b>
                <span>{p.industry}</span>
              </span>
            </div>

            <div className="pj-copy" data-reveal>
              <div className="pj-index" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="sc-kicker">{p.category}</div>
              <h3 id={`${p.slug}-name`}>{p.name}</h3>
              <div className="pj-meta">
                {p.client && <span>Client · {p.client}</span>}
                {p.country && <span>{p.country}</span>}
              </div>
              <p className="pj-summary">{p.summary}</p>
              {p.highlights.length > 0 && (
                <ul className="pj-highlights">
                  {p.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              )}
              <div className="pj-actions">
                {p.url ? (
                  <a className="sc-btn sc-btn--solid" href={p.url} target="_blank" rel="noopener">
                    Visit live site
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M7 17 17 7M8 7h9v9" />
                    </svg>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  <Link className="sc-btn" href="/#contact">
                    Ask us about this project
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
