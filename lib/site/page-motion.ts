import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis } from "@/lib/site/site-chrome";

/**
 * Motion for the /projects and /tools pages. Content is server-rendered and fully
 * visible without JavaScript; this only adds entrance and hover effects.
 *
 *   [data-split]     headline split into letters that rise in
 *   [data-reveal]    fades up when scrolled into view
 *   [data-count]     counts up to its number
 *   [data-stamp]     lands with a stamp hit
 *   [data-spot]      radial highlight that follows the cursor (sets --mx / --my)
 *   [data-tilt]      gentle 3D tilt toward the cursor
 *   [data-parallax]  child <img> drifts while the frame scrolls past
 */
export function initPageMotion(root: HTMLElement): () => void {
  gsap.registerPlugin(ScrollTrigger);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  const ac = new AbortController();
  const on = { signal: ac.signal, passive: true } as const;

  const lenis = getLenis();
  if (lenis) lenis.on("scroll", ScrollTrigger.update);

  const splits: { el: HTMLElement; html: string }[] = [];

  const ctx = gsap.context(() => {
    root.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
      splits.push({ el, html: el.innerHTML });
      el.setAttribute("aria-label", el.textContent?.replace(/\s+/g, " ").trim() ?? "");
      const wrap = (node: Node): Node[] => {
        if (node.nodeType === Node.TEXT_NODE) {
          return (node.textContent ?? "").split(/(\s+)/).filter(Boolean).map((word) => {
            if (/^\s+$/.test(word)) return document.createTextNode(" ");
            const w = document.createElement("span");
            w.className = "sp-word";
            for (const ch of word) {
              const c = document.createElement("span");
              c.className = "sp-ch";
              c.textContent = ch;
              w.appendChild(c);
            }
            return w;
          });
        }
        if (node instanceof HTMLElement) {
          const kids = [...node.childNodes].flatMap(wrap);
          node.replaceChildren(...kids);
        }
        return [node];
      };
      const kids = [...el.childNodes].flatMap(wrap);
      el.replaceChildren(...kids);
      el.querySelectorAll(".sp-word").forEach((w) => w.setAttribute("aria-hidden", "true"));
      if (!reduced) {
        gsap.from(el.querySelectorAll(".sp-ch"), {
          yPercent: 110,
          rotateX: -70,
          opacity: 0,
          duration: 0.9,
          ease: "power4.out",
          stagger: 0.022,
          delay: 0.1,
        });
      }
    });

    root.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
      const end = Number(el.dataset.count);
      if (reduced || !Number.isFinite(end)) return;
      const obj = { v: 0 };
      gsap.to(obj, {
        v: end,
        duration: 1.6,
        ease: "power2.out",
        delay: 0.4,
        onUpdate: () => (el.textContent = String(Math.round(obj.v))),
        scrollTrigger: { trigger: el, start: "top 95%", once: true },
      });
    });

    if (reduced) return;

    root.querySelectorAll<HTMLElement>("[data-stamp]").forEach((el) => {
      gsap.fromTo(
        el,
        { scale: 2.6, opacity: 0, rotate: -28 },
        {
          scale: 1,
          opacity: 1,
          rotate: Number(el.dataset.stamp) || -8,
          duration: 0.55,
          ease: "back.out(2.2)",
          delay: 0.2,
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        },
      );
    });

    const reveals = gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-reveal]"));
    gsap.set(reveals, { opacity: 0, y: 46 });
    ScrollTrigger.batch(reveals, {
      start: "top 92%",
      once: true,
      onEnter: (els) =>
        gsap.to(els, { opacity: 1, y: 0, duration: 0.85, ease: "power3.out", stagger: 0.09, overwrite: true }),
    });

    root.querySelectorAll<HTMLElement>("[data-parallax]").forEach((frame) => {
      const img = frame.querySelector("img");
      if (!img) return;
      gsap.fromTo(
        img,
        { yPercent: 0 },
        {
          yPercent: -12,
          ease: "none",
          scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: 0.6 },
        },
      );
    });
  }, root);

  if (fine && !reduced) {
    root.querySelectorAll<HTMLElement>("[data-spot]").forEach((el) => {
      el.addEventListener(
        "pointermove",
        (e) => {
          const r = el.getBoundingClientRect();
          el.style.setProperty("--mx", `${e.clientX - r.left}px`);
          el.style.setProperty("--my", `${e.clientY - r.top}px`);
        },
        on,
      );
    });
    root.querySelectorAll<HTMLElement>("[data-tilt]").forEach((el) => {
      const max = Number(el.dataset.tilt) || 6;
      el.addEventListener(
        "pointermove",
        (e) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(el, { rotateY: px * max, rotateX: -py * max, transformPerspective: 900, duration: 0.5, ease: "power2.out" });
        },
        on,
      );
      el.addEventListener("pointerleave", () => gsap.to(el, { rotateY: 0, rotateX: 0, duration: 0.7, ease: "power3.out" }), on);
    });
  }

  requestAnimationFrame(() => ScrollTrigger.refresh());

  return () => {
    ac.abort();
    ctx.revert();
    if (lenis) lenis.off("scroll", ScrollTrigger.update);
    splits.forEach(({ el, html }) => {
      el.innerHTML = html;
      el.removeAttribute("aria-label");
    });
  };
}
