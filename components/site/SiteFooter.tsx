import { PHONES, TOOLS, TOOL_KEYS } from "@/lib/seo/site";

const COMPANY = [
  { href: "/#about", label: "About" },
  { href: "/#services", label: "Services" },
  { href: "/#process", label: "Process" },
  { href: "/projects", label: "Projects" },
  { href: "/#contact", label: "Contact" },
];

const SOCIAL = [
  { href: "https://www.instagram.com/runexe.tech/", label: "Instagram" },
  { href: "https://www.facebook.com/profile.php?id=61576570486275", label: "Facebook" },
  { href: "https://share.google/InFSLb6UJEap648UI", label: "Google" },
];

const DIVIDER = "M0 30 H300 L330 10 H560 L590 30 H860 L890 50 H1200";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <svg className="sf-divider" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true">
        <path d={DIVIDER} />
        <path className="sf-live" d={DIVIDER} pathLength={100} />
        <circle cx="330" cy="10" r="4" />
        <circle cx="590" cy="30" r="4" />
        <circle cx="890" cy="50" r="4" />
      </svg>

      <div className="sf-inner">
        <div className="sf-brand">
          <a href="/#hero" className="nav-logo" aria-label="RunExe Technology home">
            <img className="logo-light" src="/assets/logo-trimmed.png" alt="RunExe Technology" width={160} height={46} />
            <img className="logo-dark" src="/assets/logo-trimmed-dark.png" alt="" aria-hidden="true" width={160} height={46} />
          </a>
          <p>
            A software engineering studio building custom platforms, AI automation, mobile apps and cloud
            products.
          </p>
          <a href="/#contact" className="sf-cta">
            Start a project
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M7 17 17 7M8 7h9v9" />
            </svg>
          </a>
        </div>

        <nav className="sf-col" aria-label="Company">
          <p className="sf-head">Company</p>
          <ul>
            {COMPANY.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sf-col sf-col--contact">
          <p className="sf-head">Get in touch</p>
          <ul className="sf-contact">
            <li>
              <a href="mailto:info@runexe.tech">info@runexe.tech</a>
            </li>
            {PHONES.map((p) => (
              <li key={p.tel}>
                <a href={`tel:${p.tel}`}>{p.display}</a>
              </li>
            ))}
          </ul>
          <p className="sf-social-label">Social</p>
          <ul className="sf-social">
            {SOCIAL.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noopener">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav className="sf-col sf-col--tools" aria-label="Free tools">
          <div className="sf-tools-head">
            <p className="sf-head">Free tools</p>
            <a href="/tools" className="sf-all">
              All tools →
            </a>
          </div>
          <ul className="sf-tools">
            {TOOL_KEYS.map((k) => (
              <li key={k}>
                <a href={TOOLS[k].path}>{TOOLS[k].name}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="sf-bottom">
        <span>© {new Date().getFullYear()} RunExe Technology. Engineered to execute.</span>
        <span>Remote-first · Worldwide</span>
      </div>
    </footer>
  );
}
