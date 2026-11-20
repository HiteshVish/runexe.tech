// @ts-nocheck — shared atmosphere: cursor, circuit background, smooth scroll, theme, nav
import Lenis from "lenis";

let lenis: InstanceType<typeof Lenis> | null = null;
let rewireTraces = () => {};

export function getLenis() {
  return lenis;
}

export function rewireBackground() {
  rewireTraces();
}

export function initSiteChrome(): () => void {
  const ac = new AbortController();
  const sig = { signal: ac.signal };
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile =
    window.matchMedia("(max-width: 768px)").matches ||
    ("ontouchstart" in window && window.innerWidth < 1024);
  const LITE = prefersReduced || isMobile;
  const CRIMSON = "#8B1A1A";
  if (prefersReduced) document.documentElement.classList.add("reduced");

  /* ---------- smooth scroll ---------- */
  if (!prefersReduced) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    let rafId = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    ac.signal.addEventListener("abort", () => {
      cancelAnimationFrame(rafId);
      lenis?.destroy();
      lenis = null;
    });
  }

  document.addEventListener(
    "click",
    (e) => {
      const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!a) return;
      const href = a.getAttribute("href") || "";
      const hash = href.startsWith("#") ? href : href.startsWith("/#") ? href.slice(1) : "";
      if (hash.length < 2) return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.4 });
      else target.scrollIntoView({ behavior: "smooth" });
    },
    sig
  );

  /* ---------- theme ---------- */
  const THEME_KEY = "runexe-theme";
  const themeBtn = document.getElementById("theme-toggle");
  const themeMQ = window.matchMedia("(prefers-color-scheme: dark)");

  function applyTheme(theme: string, persist: boolean) {
    document.documentElement.setAttribute("data-theme", theme);
    if (themeBtn) {
      const dark = theme === "dark";
      themeBtn.setAttribute("aria-pressed", String(dark));
      themeBtn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    }
    if (persist) {
      try {
        const sys = themeMQ.matches ? "dark" : "light";
        if (theme === sys) localStorage.removeItem(THEME_KEY);
        else localStorage.setItem(THEME_KEY, theme);
      } catch (e) {}
    }
    document.documentElement.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
  }

  applyTheme(document.documentElement.getAttribute("data-theme") || "light", false);
  themeBtn?.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next, true);
  });
  const onSysTheme = (e) => {
    try {
      if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? "dark" : "light", false);
    } catch (err) {}
  };
  if (themeMQ.addEventListener) themeMQ.addEventListener("change", onSysTheme, sig);

  /* ---------- cursor ---------- */
  const cursorCanvas = document.getElementById("cursor-canvas");
  const cursorDot = document.getElementById("cursor-dot");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!LITE && finePointer && cursorCanvas && cursorDot) {
    const cctx = cursorCanvas.getContext("2d");
    const CDPR = Math.min(devicePixelRatio || 1, 2);
    const TRAIL_MS = 370;
    let cw = 0, ch = 0;
    const fitCursor = () => {
      cw = innerWidth;
      ch = innerHeight;
      cursorCanvas.width = cw * CDPR;
      cursorCanvas.height = ch * CDPR;
      cursorCanvas.style.width = cw + "px";
      cursorCanvas.style.height = ch + "px";
      cctx.setTransform(CDPR, 0, 0, CDPR, 0, 0);
    };
    fitCursor();
    addEventListener("resize", fitCursor, sig);

    const mouse = { x: 0, y: 0 };
    const follow = { x: 0, y: 0 };
    const trail = [];
    const bursts = [];
    let shown = false, cursorRaf = 0, lastT = 0, burstHost = null;
    const kick = () => {
      if (!cursorRaf) cursorRaf = requestAnimationFrame(cursorFrame);
    };
    ac.signal.addEventListener("abort", () => cancelAnimationFrame(cursorRaf));

    addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType === "touch") return;
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        cursorDot.style.transform = `translate3d(${mouse.x}px,${mouse.y}px,0) translate(-50%,-50%)`;
        if (!shown) {
          shown = true;
          follow.x = mouse.x;
          follow.y = mouse.y;
          trail.length = 0;
          document.body.classList.add("custom-cursor-on");
          cursorDot.classList.add("is-visible");
        }
        kick();
      },
      { passive: true, signal: ac.signal }
    );
    document.documentElement.addEventListener(
      "mouseleave",
      () => {
        shown = false;
        burstHost = null;
        cursorDot.classList.remove("is-visible", "is-hover", "is-down");
        trail.length = 0;
        kick();
      },
      sig
    );
    addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "touch") cursorDot.classList.add("is-down");
    }, sig);
    const release = () => cursorDot.classList.remove("is-down");
    addEventListener("pointerup", release, sig);
    addEventListener("pointercancel", release, sig);
    addEventListener("blur", release, sig);

    const hoverables = "a, button, .service-card, .work-card, input, textarea, [data-magnetic]";
    document.addEventListener(
      "mouseover",
      (e) => {
        const t = e.target;
        cursorDot.classList.toggle("is-hover", !!(t.closest && t.closest(hoverables)));
        const host = t.closest && t.closest(".btn, .service-card, .work-card, .tool-card, .nav-links a, .tool-page button");
        if (!host || host === burstHost || !shown) return;
        burstHost = host;
        const bx = e.clientX, by = e.clientY;
        for (let i = 0; i < 7; i++) {
          const a = Math.random() * Math.PI * 2, sp = 1.5 + Math.random() * 2.4;
          bursts.push({
            x: bx, y: by, ox: bx, oy: by,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1,
          });
        }
        kick();
      },
      sig
    );
    document.addEventListener(
      "mouseout",
      (e) => {
        if (burstHost && !burstHost.contains(e.relatedTarget)) burstHost = null;
      },
      sig
    );

    function cursorFrame(now) {
      cursorRaf = 0;
      const f = lastT ? Math.min((now - lastT) / 16.667, 3) : 1;
      lastT = now;
      const k = 1 - Math.pow(0.78, f);
      follow.x += (mouse.x - follow.x) * k;
      follow.y += (mouse.y - follow.y) * k;
      trail.unshift({ x: follow.x, y: follow.y, t: now });
      while (trail.length > 1 && (trail.length > 120 || now - trail[trail.length - 1].t > TRAIL_MS)) trail.pop();

      cctx.clearRect(0, 0, cw, ch);
      const tail = trail[trail.length - 1];
      const spread = tail ? Math.hypot(tail.x - mouse.x, tail.y - mouse.y) : 0;
      if (shown && spread > 0.5) {
        cctx.beginPath();
        cctx.moveTo(mouse.x, mouse.y);
        for (let i = 0; i < trail.length; i++) cctx.lineTo(trail[i].x, trail[i].y);
        cctx.strokeStyle = "rgba(139,26,26,.28)";
        cctx.lineWidth = 1.4;
        cctx.lineCap = "round";
        cctx.lineJoin = "round";
        cctx.stroke();
        cctx.beginPath();
        cctx.arc(tail.x, tail.y, 2, 0, 7);
        cctx.fillStyle = "rgba(139,26,26,.35)";
        cctx.fill();
      }
      const drag = Math.pow(0.94, f);
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        b.x += b.vx * f;
        b.y += b.vy * f;
        b.vx *= drag;
        b.vy *= drag;
        b.life -= 0.028 * f;
        if (b.life <= 0) {
          bursts.splice(i, 1);
          continue;
        }
        cctx.globalAlpha = b.life * 0.75;
        cctx.beginPath();
        cctx.moveTo(b.ox, b.oy);
        cctx.lineTo(b.x, b.y);
        cctx.strokeStyle = CRIMSON;
        cctx.lineWidth = 1;
        cctx.stroke();
        cctx.beginPath();
        cctx.arc(b.x, b.y, 2.4, 0, 7);
        cctx.fillStyle = CRIMSON;
        cctx.fill();
        cctx.globalAlpha = 1;
      }
      if (spread > 0.5 || bursts.length) cursorRaf = requestAnimationFrame(cursorFrame);
      else lastT = 0;
    }
  }

  /* ---------- background ---------- */
  const bgCanvas = document.getElementById("bg-canvas");
  const bctx = bgCanvas.getContext("2d");
  let BW = 0, BH = 0;
  const DPR = Math.min(devicePixelRatio || 1, 2);
  function fitBG() {
    BW = innerWidth;
    BH = innerHeight;
    bgCanvas.width = BW * DPR;
    bgCanvas.height = BH * DPR;
    bgCanvas.style.width = BW + "px";
    bgCanvas.style.height = BH + "px";
    bctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  fitBG();

  let traces = [], travelers = [], traceAlpha = 1, rewiring = false;
  function buildTraces() {
    traces = [];
    travelers = [];
    const n = LITE ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const pts = [];
      let x = -40, y = Math.random() * BH;
      pts.push({ x, y });
      while (x < BW + 60) {
        x += 90 + Math.random() * 190;
        if (Math.random() < 0.55) {
          const dy = (Math.random() < 0.5 ? -1 : 1) * (30 + Math.random() * 70);
          pts.push({ x, y });
          y = Math.max(30, Math.min(BH - 30, y + dy));
        }
        pts.push({ x, y });
      }
      const segs = [];
      let len = 0;
      for (let k = 1; k < pts.length; k++) {
        const s = Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y);
        segs.push(s);
        len += s;
      }
      traces.push({ pts, segs, len, crimson: Math.random() < 0.3 });
    }
    const tn = LITE ? 1 : 2;
    for (let i = 0; i < tn; i++) {
      travelers.push({
        trace: (Math.random() * traces.length) | 0,
        t: Math.random(),
        speed: 0.0006 + Math.random() * 0.0012,
      });
    }
  }
  buildTraces();
  addEventListener("resize", () => { fitBG(); buildTraces(); }, sig);

  rewireTraces = () => {
    if (rewiring || prefersReduced) return;
    rewiring = true;
    const fade = (from, to, ms, done) => {
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / ms);
        const eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        traceAlpha = from + (to - from) * eased;
        if (k < 1) requestAnimationFrame(step);
        else done();
      };
      requestAnimationFrame(step);
    };
    fade(traceAlpha, 0, 500, () => {
      buildTraces();
      fade(0, 1, 800, () => { rewiring = false; });
    });
  };

  const particles = [];
  const P_COUNT = LITE ? 10 : 18;
  for (let i = 0; i < P_COUNT; i++) {
    particles.push({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: 1 + Math.random() * 1.6,
    });
  }
  function pointAt(tr, t) {
    let d = t * tr.len;
    for (let i = 1; i < tr.pts.length; i++) {
      const seg = tr.segs[i - 1];
      if (d <= seg) {
        const k = seg === 0 ? 0 : d / seg;
        return {
          x: tr.pts[i - 1].x + (tr.pts[i].x - tr.pts[i - 1].x) * k,
          y: tr.pts[i - 1].y + (tr.pts[i].y - tr.pts[i - 1].y) * k,
        };
      }
      d -= seg;
    }
    return tr.pts[tr.pts.length - 1];
  }

  let C = {};
  function refreshCanvasColors() {
    const s = getComputedStyle(document.documentElement);
    const v = (n) => s.getPropertyValue(n).trim();
    C = {
      grid: v("--c-grid"),
      node: v("--c-node"),
      trace: v("--c-trace"),
      traceCr: v("--c-trace-cr"),
      nodeInk: v("--c-node-ink"),
      nodeCr: v("--c-node-cr"),
      link: v("--c-link"),
      particle: v("--c-particle"),
    };
  }
  refreshCanvasColors();
  document.documentElement.addEventListener("themechange", refreshCanvasColors, sig);

  function drawBG() {
    bctx.clearRect(0, 0, BW, BH);
    const scrollY = lenis ? lenis.scroll : window.scrollY;
    const gridShift = (scrollY * 0.04) % 120;
    const traceShift = (scrollY * 0.1) % (BH * 2);
    const partShift = scrollY * 0.16;

    bctx.strokeStyle = C.grid;
    bctx.lineWidth = 1;
    bctx.beginPath();
    for (let gx = -gridShift; gx < BW; gx += 180) { bctx.moveTo(gx, 0); bctx.lineTo(gx, BH); }
    for (let gy = -gridShift; gy < BH; gy += 180) { bctx.moveTo(0, gy); bctx.lineTo(BW, gy); }
    bctx.stroke();
    bctx.fillStyle = C.node;
    for (let gx = -gridShift; gx < BW; gx += 360) {
      for (let gy = -gridShift; gy < BH; gy += 360) {
        bctx.beginPath();
        bctx.arc(gx, gy, 1.6, 0, 7);
        bctx.fill();
      }
    }

    bctx.save();
    bctx.globalAlpha = traceAlpha;
    const yOff = -(traceShift % 40);
    traces.forEach((tr) => {
      bctx.beginPath();
      tr.pts.forEach((p, i) => {
        const py = p.y + yOff;
        i === 0 ? bctx.moveTo(p.x, py) : bctx.lineTo(p.x, py);
      });
      bctx.strokeStyle = tr.crimson ? C.traceCr : C.trace;
      bctx.lineWidth = 1.2;
      bctx.stroke();
      tr.pts.forEach((p, i) => {
        if (i === 0 || i === tr.pts.length - 1) return;
        bctx.beginPath();
        bctx.arc(p.x, p.y + yOff, 2, 0, 7);
        bctx.fillStyle = tr.crimson ? C.nodeCr : C.nodeInk;
        bctx.fill();
      });
    });
    travelers.forEach((tv) => {
      tv.t += tv.speed;
      if (tv.t > 1) { tv.t = 0; tv.trace = (Math.random() * traces.length) | 0; }
      const tr = traces[tv.trace];
      if (!tr) return;
      const p = pointAt(tr, tv.t);
      const grd = bctx.createRadialGradient(p.x, p.y + yOff, 0, p.x, p.y + yOff, 9);
      grd.addColorStop(0, "rgba(139,26,26,.65)");
      grd.addColorStop(1, "rgba(139,26,26,0)");
      bctx.fillStyle = grd;
      bctx.beginPath();
      bctx.arc(p.x, p.y + yOff, 9, 0, 7);
      bctx.fill();
      bctx.beginPath();
      bctx.arc(p.x, p.y + yOff, 2.2, 0, 7);
      bctx.fillStyle = CRIMSON;
      bctx.fill();
    });
    bctx.restore();

    const py = (p) => ((p.y - partShift) % BH + BH) % BH;
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = BW;
      if (p.x > BW) p.x = 0;
    });
    bctx.strokeStyle = C.link;
    bctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const ay = py(a), by = py(b);
        const d = Math.hypot(a.x - b.x, ay - by);
        if (d < 90) {
          bctx.globalAlpha = 1 - d / 90;
          bctx.beginPath();
          bctx.moveTo(a.x, ay);
          bctx.lineTo(b.x, by);
          bctx.stroke();
          bctx.globalAlpha = 1;
        }
      }
    }
    particles.forEach((p) => {
      bctx.beginPath();
      bctx.arc(p.x, py(p), p.r, 0, 7);
      bctx.fillStyle = C.particle;
      bctx.fill();
    });
  }

  let bgRaf = 0;
  const bgLoop = () => {
    bgRaf = requestAnimationFrame(bgLoop);
    if (document.hidden) return;
    drawBG();
  };
  if (!prefersReduced) bgRaf = requestAnimationFrame(bgLoop);
  else drawBG();
  ac.signal.addEventListener("abort", () => cancelAnimationFrame(bgRaf));

  /* ---------- scroll signal + nav state ---------- */
  const signalFill = document.querySelector("#scroll-signal .fill");
  const signalPulse = document.querySelector("#scroll-signal .pulse");
  const nav = document.getElementById("nav");
  const onScrollChrome = () => {
    const y = lenis ? lenis.scroll : window.scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const p = Math.min(1, Math.max(0, y / max));
    if (signalFill) signalFill.style.transform = `scaleY(${p})`;
    if (signalPulse) signalPulse.style.top = p * 100 + "%";
    nav?.classList.toggle("scrolled", y > 80);
  };
  if (lenis) lenis.on("scroll", onScrollChrome);
  else addEventListener("scroll", onScrollChrome, { passive: true, signal: ac.signal });
  onScrollChrome();

  return () => {
    ac.abort();
    rewireTraces = () => {};
    document.body.classList.remove("custom-cursor-on");
  };
}
