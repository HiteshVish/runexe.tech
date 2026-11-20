// @ts-nocheck — faithful port of legacy inline script
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenis, rewireBackground } from '@/lib/site/site-chrome';

export function initRunexeHome(): () => void {

/* ============================================================
   Lifecycle — everything registered through these helpers is
   undone by the cleanup function returned at the bottom, so a
   re-mount never leaves a second set of loops running.
   ============================================================ */
const ac = new AbortController();
const sig = { signal: ac.signal };           // window / document listeners
const tickers = [];
const addTicker = (fn) => { tickers.push(fn); gsap.ticker.add(fn); };
const timers = new Set();
const later = (fn, ms) => {
  const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
  timers.add(id);
  return id;
};
const disposers = [];
let disposed = false;

/* ============================================================
   0. Environment
   ============================================================ */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 768px)').matches || ('ontouchstart' in window && window.innerWidth < 1024);
const LITE = prefersReduced || isMobile;   // lighter animation path

gsap.registerPlugin(ScrollTrigger);
gsap.defaults({ ease: 'power3.out' });

/* ============================================================
   1. Shared chrome
      The cursor, circuit background, header, theme and smooth
      scrolling belong to the site layout, so they persist on
      every page. Here we only connect this page's scroll
      animations to that shared scroller, and rewire the
      background as each home section arrives.
   ============================================================ */
const lenis = getLenis();
if (lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  disposers.push(() => lenis.off('scroll', ScrollTrigger.update));
  gsap.ticker.lagSmoothing(0);
  disposers.push(() => gsap.ticker.lagSmoothing(500, 33));
}
if (!LITE) {
  ['#about', '#services', '#process', '#work', '#tools', '#testimonials', '#faq', '#contact'].forEach(sel => {
    if (!document.querySelector(sel)) return;
    ScrollTrigger.create({
      trigger: sel, start: 'top 70%',
      onEnter: rewireBackground, onLeaveBack: rewireBackground
    });
  });
}

/* ============================================================
   7. Text splitting helpers
   ============================================================ */
// Hero title: build chars from data-text (per segment, so lines can mix colors)
document.querySelectorAll('#hero-title .seg').forEach(seg => {
  const text = seg.dataset.text;
  const cls = seg.classList.contains('cr') ? ' cr' : '';
  seg.innerHTML = text.split('').map(c => `<span class="ch${cls}">${c}</span>`).join('');
  seg.setAttribute('aria-hidden', 'true');
});
// Section titles / leads: split into words
document.querySelectorAll('.split-lines').forEach(el => {
  const walk = (node) => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(tok => {
          if (/^\s+$/.test(tok)) frag.appendChild(document.createTextNode(' '));
          else if (tok) {
            const w = document.createElement('span'); w.className = 'w';
            const wi = document.createElement('span'); wi.className = 'wi';
            wi.textContent = tok; w.appendChild(wi); frag.appendChild(w);
          }
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1) walk(child);
    });
  };
  walk(el);
});

/* ============================================================
   8. Preloader → hero intro
   ============================================================ */
const pre = document.getElementById('preloader');

function heroIntro() {
  const tl = gsap.timeline();
  tl.from('#hero-title .ch', { yPercent: 118, rotate: 4, duration: 1, stagger: 0.03, ease: 'power4.out' }, 0)
    .from('.hero-corner', { opacity: 0, scale: .3, duration: .5, stagger: .06 }, 0.2)
    .from('.reveal-load', { y: 34, opacity: 0, duration: .9, stagger: 0.12 }, 0.45)
    .from('.hero-kicker i', { scaleX: 0, transformOrigin: 'left center', duration: .8 }, 0.7)
    .from('.hero-visual', { y: 28, opacity: 0, duration: .9, ease: 'power3.out' }, 0.7)
    .from('.nav', { y: -24, opacity: 0, duration: .8 }, 0.4)
    .from('.pipe-row', { x: -16, opacity: 0, duration: .55, stagger: .08 }, 0.95)
    .from('.pipe-bar span', { width: 0, duration: 1.2, ease: 'power2.inOut' }, 1.5)
    .from('.pipe-badge', { scale: 0, rotate: -90, duration: .7, ease: 'back.out(1.8)' }, 1.3)
    .from('.hero-sheet', { opacity: 0, duration: .6 }, 1.1)
    .from('.hero-sheet > span', { y: 10, opacity: 0, duration: .5, stagger: .07 }, 1.2);

  // Counters run from zero to the value already in the markup.
  document.querySelectorAll('#hero [data-count]').forEach(el => {
    const to = Number(el.dataset.count) || 0;
    const o = { v: 0 };
    el.textContent = '0';
    tl.to(o, { v: to, duration: 1.3, ease: 'power2.out', onUpdate: () => { el.textContent = String(Math.round(o.v)); } }, 1.5);
  });

  // Rubber-stamp hits: drop in large, land hard, jolt the card.
  const jolt = (at) => tl.fromTo('.pipe', { y: 0 }, {
    keyframes: [{ y: 3, duration: .04 }, { y: -1, duration: .07 }, { y: 0, duration: .12 }]
  }, at);
  tl.fromTo('.pipe-row.is-done .stamp',
    { scale: 2.6, rotate: -18, opacity: 0 },
    { scale: 1, rotate: -4, opacity: 1, duration: .28, ease: 'power4.in', stagger: .32 }, 1.6);
  jolt(1.88); jolt(2.2);
  tl.fromTo('.pipe-stamp',
    { scale: 3, rotate: -26, opacity: 0 },
    { scale: 1, rotate: -9, opacity: .9, duration: .36, ease: 'power4.in' }, 2.6);
  jolt(2.96);
}

if (prefersReduced) {
  pre.remove();
  gsap.set(['#hero-title .ch', '.reveal-load', '.hero-visual', '.nav', '.hero-sheet'], { clearProps: 'all' });
} else {
  document.documentElement.style.overflow = 'hidden';
  const intro = gsap.timeline({
    onComplete(){
      document.documentElement.style.overflow = '';
      pre.remove();
    }
  });
  // The logo mark wipes in with a CSS animation that starts at first paint,
  // before this script has loaded. Pick up from wherever it has got to.
  let markLeft = 0;
  pre.querySelectorAll('.pl-mark').forEach(el => {
    (el.getAnimations ? el.getAnimations() : []).forEach(a => {
      const end = a.effect && a.effect.getComputedTiming().endTime;
      if (typeof end === 'number') markLeft = Math.max(markLeft, (end - (a.currentTime || 0)) / 1000);
    });
  });
  // y: 0 is explicit because the stylesheet parks the wordmark at translateY(110%),
  // which GSAP reads as a pixel offset that yPercent alone would never remove.
  intro.fromTo('#preloader .pl-wordimg',
            { yPercent: 110, y: 0, opacity: 0 },
            { yPercent: 0, y: 0, opacity: 1, duration: .5, ease: 'power3.out' },
            Math.max(0, markLeft - 0.25))
       .to(pre, { yPercent: -100, duration: .7, ease: 'power4.inOut', delay: .15,
            onStart: heroIntro });
}

/* ============================================================
   9b. Hero terminal — typed "runexe" deploy sequence (loops)
   ============================================================ */
(function initTerminal(){
  const body = document.getElementById('ht-body');
  if (!body) return;
  const script = [
    { t: 'runexe init "your-next-big-idea"', cmd: true },
    { t: '✓ blueprint ready — fixed scope, firm quote', cls: 'ok' },
    { t: 'runexe build --sprints weekly', cmd: true },
    { t: '▸ ui · api · infra assembled in parallel', cls: 'dim' },
    { t: '✓ staging live — week 2', cls: 'ok' },
    { t: 'runexe deploy --prod', cmd: true },
    { t: '✓ shipped · monitoring on', cls: 'ok' }
  ];
  if (prefersReduced) {
    body.innerHTML = script.map(l =>
      `<div class="ht-line ${l.cls || ''}">${l.cmd ? '<span class="p">$</span> ' : ''}${l.t}</div>`
    ).join('');
    return;
  }
  const caret = document.createElement('span');
  caret.className = 'ht-caret';
  let li = 0;
  function nextLine() {
    if (li >= script.length) {
      later(() => { body.innerHTML = ''; li = 0; nextLine(); }, 4200);
      return;
    }
    const l = script[li++];
    const div = document.createElement('div');
    div.className = 'ht-line ' + (l.cls || '');
    body.appendChild(div);
    if (l.cmd) {
      div.innerHTML = '<span class="p">$</span> ';
      div.appendChild(caret); // moves the caret into the active line
      let ci = 0;
      (function typeChar(){
        if (ci < l.t.length) {
          caret.insertAdjacentText('beforebegin', l.t[ci++]);
          later(typeChar, 24 + Math.random() * 42);
        } else {
          later(nextLine, 450);
        }
      })();
    } else {
      div.textContent = l.t;
      later(nextLine, 520);
    }
  }
  later(nextLine, 1600); // start after the intro settles
})();

// Floating stat chips
if (!prefersReduced) {
  gsap.to('.hc-1', { y: -12, duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  gsap.to('.hc-2', { y: 12, duration: 3.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
}

/* ============================================================
   10. Generic scroll reveals
   ============================================================ */
if (!prefersReduced) {
  // word-level title reveals
  document.querySelectorAll('.split-lines').forEach(el => {
    gsap.from(el.querySelectorAll('.wi'), {
      yPercent: 115, duration: 0.9, stagger: 0.03, ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 86%' }
    });
  });
  // block reveals: cards that enter the viewport together rise as one staggered
  // group. Work cards are left out because initWork runs their own reveal.
  ScrollTrigger.batch('.reveal:not(.work-card)', {
    start: 'top 92%',
    once: true,
    onEnter: (els) => gsap.to(els, {
      y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.08
    })
  });
  document.querySelectorAll('.section-tag').forEach(el => {
    gsap.from(el, {
      x: -26, opacity: 0, duration: .8,
      scrollTrigger: { trigger: el, start: 'top 90%' }
    });
  });
} else {
  document.querySelectorAll('.reveal').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
}

/* ============================================================
   10b. Section cards — pop in from left / right / bottom
   Animate the inner .container so we never transform the
   section itself (that breaks pinning + sticky children).
   ============================================================ */
if (!prefersReduced) {
  document.querySelectorAll('[data-enter]').forEach(sec => {
    const dir = sec.dataset.enter;
    if (dir === 'fade') return;
    const card = sec.querySelector(':scope > .container') || sec;
    const from = { opacity: 0 };
    // Short travel so the section settles quickly instead of flying in from
    // off screen, and plays once so it never replays while scrolling back.
    if (LITE) {
      from.y = 40;
    } else {
      from.scale = 0.98;
      if (dir === 'left') from.x = '-6vw';
      else if (dir === 'right') from.x = '6vw';
      else from.y = 60;
    }
    gsap.from(card, {
      ...from,
      duration: 0.8,
      ease: 'power3.out',
      clearProps: 'transform',
      scrollTrigger: {
        trigger: sec,
        start: 'top 88%',
        once: true
      }
    });
  });
}

/* ============================================================
   11. About — pinned scrub + self-drawing circuit
   ============================================================ */
(function initAbout(){
  const steps = gsap.utils.toArray('.about-step');
  const tracesSvg = gsap.utils.toArray('#about-svg .trace');
  // ghost copies behind live traces
  const ghostG = document.querySelector('#about-svg .ghost');
  tracesSvg.forEach(p => {
    const g = p.cloneNode();
    g.setAttribute('class', 'trace-ghost');
    ghostG.appendChild(g);
  });
  tracesSvg.forEach(p => {
    const L = p.getTotalLength();
    p.style.strokeDasharray = L;
    p.style.strokeDashoffset = L;
  });

  if (prefersReduced) {
    tracesSvg.forEach(p => p.style.strokeDashoffset = 0);
    steps.forEach((s, i) => { s.style.position = 'relative'; s.style.opacity = 1; s.style.visibility = 'visible'; });
    return;
  }

  const pinOK = !isMobile;
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#about-pin',
      start: 'top ' + (pinOK ? '18%' : '75%'),
      end: pinOK ? '+=180%' : 'bottom 40%',
      pin: pinOK,
      scrub: 0.6
    }
  });

  // draw traces progressively across the whole scrub
  tl.to(tracesSvg, { strokeDashoffset: 0, duration: 3, stagger: 0.5, ease: 'none' }, 0);
  // node pop-ins
  tl.from('#about-nodes circle', { scale: 0, transformOrigin: 'center', duration: 1.2, stagger: 0.15, ease: 'back.out(2)' }, 0.3);

  // step swaps
  steps.forEach((s, i) => {
    if (i === 0) {
      gsap.set(s, { autoAlpha: 1 });
      if (steps.length > 1) tl.to(s, { autoAlpha: 0, y: -26, duration: .6 }, 1.4);
    } else {
      tl.fromTo(s, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: .6 }, 1.4 + (i - 1) * 1.5)
      ;
      if (i < steps.length - 1) tl.to(s, { autoAlpha: 0, y: -26, duration: .6 }, 1.4 + i * 1.5);
    }
  });
})();

/* ============================================================
   12. Services — branch wires + 3D tilt cards
   ============================================================ */
(function initServices(){
  const grid = document.getElementById('services-grid');
  const cards = gsap.utils.toArray('.service-card');
  const wires = document.getElementById('services-wires');
  const section = document.getElementById('services');

  // Branch wires from a spine above the grid to each card's port
  function buildWires() {
    if (LITE) return;
    wires.innerHTML = '';
    const sRect = section.getBoundingClientRect();
    const gRect = grid.getBoundingClientRect();
    const spineY = gRect.top - sRect.top - 46;
    const originX = gRect.left - sRect.left + gRect.width / 2;
    wires.setAttribute('viewBox', `0 0 ${sRect.width} ${sRect.height}`);
    wires.setAttribute('width', sRect.width);
    wires.setAttribute('height', sRect.height);
    cards.forEach(card => {
      const r = card.getBoundingClientRect();
      const cx = r.left - sRect.left + r.width / 2;
      const cy = r.top - sRect.top;
      const midY = spineY + (cy - spineY) * 0.45;
      const d = `M${originX} ${spineY - 26} V${spineY} H${cx > originX ? cx - 24 : cx + 24} L${cx} ${midY} V${cy}`;
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', d);
      wires.appendChild(p);
      const L = p.getTotalLength();
      p.style.strokeDasharray = L;
      p.style.strokeDashoffset = L;
    });
  }
  buildWires();
  addEventListener('resize', buildWires, sig);

  if (!LITE) {
    ScrollTrigger.create({
      trigger: grid, start: 'top 80%',
      onEnter(){
        buildWires();
        gsap.to('#services-wires path', {
          strokeDashoffset: 0, duration: 1.4, stagger: 0.12, ease: 'power2.inOut',
          onComplete(){ cards.forEach(c => c.classList.add('wired')); }
        });
      },
      once: true
    });
  }

  // 3D tilt + glow position
  if (!LITE) {
    cards.forEach(card => {
      let rx = 0, ry = 0, tx = 0, ty = 0, raf = null;
      const damp = () => {
        rx += (tx - rx) * 0.12; ry += (ty - ry) * 0.12;
        card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
        if (Math.abs(tx - rx) > 0.01 || Math.abs(ty - ry) > 0.01) raf = requestAnimationFrame(damp);
        else raf = null;
      };
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (px * 100) + '%');
        card.style.setProperty('--my', (py * 100) + '%');
        tx = (0.5 - py) * 10; ty = (px - 0.5) * 12;
        if (!raf) raf = requestAnimationFrame(damp);
      });
      card.addEventListener('mouseleave', () => {
        tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(damp);
      });
    });
  }
})();

/* ============================================================
   13. Process — fill line + node activation
   ============================================================ */
(function initProcess(){
  const fill = document.getElementById('process-fill');
  const steps = gsap.utils.toArray('.process-step');
  if (prefersReduced) {
    fill.style.transform = 'scaleY(1)';
    steps.forEach(s => s.classList.add('active'));
    return;
  }
  gsap.to(fill, {
    scaleY: 1, ease: 'none',
    scrollTrigger: {
      trigger: '#process-wrap', start: 'top 65%', end: 'bottom 55%', scrub: 0.5
    }
  });
  steps.forEach(step => {
    ScrollTrigger.create({
      trigger: step, start: 'top 62%',
      onEnter(){ step.classList.add('active'); },
      onLeaveBack(){ step.classList.remove('active'); }
    });
    gsap.from(step, {
      x: -30, opacity: 0, duration: .9,
      scrollTrigger: { trigger: step, start: 'top 85%' }
    });
  });
})();

/* ============================================================
   13b. Process — sticky "code to view" synced with steps 1–5
   ============================================================ */
(function initProcessVisual(){
  const sticky = document.querySelector('.pv-sticky');
  if (!sticky) return;
  const snippets = gsap.utils.toArray('.pv-snippet');
  const layers = gsap.utils.toArray('.pv-layer');
  const pulse = document.querySelector('.pv-pulse');
  const statusText = document.getElementById('pv-status-text');
  const labels = [
    'runexe discover',
    'runexe design',
    'runexe build',
    'runexe deploy --prod',
    'runexe run --watch'
  ];

  function setStage(i) {
    snippets.forEach((el, n) => el.classList.toggle('on', n === i));
    layers.forEach((el, n) => el.classList.toggle('on', n === i));
    if (statusText) statusText.textContent = labels[i];
  }

  if (prefersReduced) {
    setStage(4);
    return;
  }

  setStage(0);

  // Keep the preview inside the How we work card (viewport-center
  // pinning was sending it outside the rounded panel).
  if (!isMobile && window.matchMedia('(min-width: 1021px)').matches) {
    const card = document.querySelector('#process .container');
    ScrollTrigger.create({
      trigger: sticky,
      start: 'top 200px',
      endTrigger: '#process-wrap',
      end: 'bottom bottom',
      pin: true,
      pinSpacing: false,
      pinType: 'transform',
      pinnedContainer: card,
      anticipatePin: 1,
      invalidateOnRefresh: true
    });
  }

  ScrollTrigger.create({
    trigger: '#process-wrap',
    start: 'top 60%',
    end: 'bottom 55%',
    scrub: 0.4,
    onUpdate(self) {
      const i = Math.min(4, Math.floor(self.progress * 5));
      setStage(i);
      if (pulse) {
        gsap.set(pulse, { y: self.progress * 23 });
      }
    }
  });
})();

/* ============================================================
   14. Work — clip reveal + hover parallax tilt
   ============================================================ */
(function initWork(){
  const cards = gsap.utils.toArray('.work-card');
  if (!prefersReduced) {
    cards.forEach((card, i) => {
      gsap.fromTo(card,
        { clipPath: 'inset(12% 12% 12% 12% round 20px)', opacity: 0, y: 60 },
        { clipPath: 'inset(0% 0% 0% 0% round 20px)', opacity: 1, y: 0,
          duration: 0.85, ease: 'power3.out', delay: (i % 2) * 0.1,
          scrollTrigger: { trigger: card, start: 'top 85%' } }
      );
    });
  }
  if (!LITE) {
    cards.forEach(card => {
      const art = card.querySelector('.wc-art');
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(card, { rotateY: px * 5, rotateX: -py * 5, duration: .6, ease: 'power2.out', transformPerspective: 900 });
        gsap.to(art, { x: px * 18, y: py * 18, duration: .6, ease: 'power2.out' });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: .8, ease: 'power3.out' });
        gsap.to(art, { x: 0, y: 0, duration: .8, ease: 'power3.out' });
      });
    });
  }
})();

/* ============================================================
   16b. Marquees — duplicate track content for seamless loop
   ============================================================ */
document.querySelectorAll('[data-marquee]').forEach(track => {
  track.innerHTML += track.innerHTML;
});

/* ============================================================
   16c. Kinetic text divider — scrubs sideways with scroll
   ============================================================ */
if (!prefersReduced) {
  gsap.utils.toArray('.kinetic .k-line').forEach(line => {
    gsap.fromTo(line, { xPercent: 2 }, {
      xPercent: -26, ease: 'none',
      scrollTrigger: {
        trigger: line.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.6
      }
    });
  });
}

/* ============================================================
   16d. FAQ accordion
   ============================================================ */
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  q.addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(o => {
      o.classList.remove('open');
      o.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
    });
    if (!wasOpen) {
      item.classList.add('open');
      q.setAttribute('aria-expanded', 'true');
    }
    // heights change — keep pinned/scrubbed sections in sync
    later(() => ScrollTrigger.refresh(), 600);
  });
});

/* ============================================================
   17. Magnetic buttons
   ============================================================ */
if (!LITE) {
  document.querySelectorAll('[data-magnetic]').forEach(el => {
    const strength = 0.35;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      gsap.to(el, { x: x * strength, y: y * strength, duration: .5, ease: 'power3.out' });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1, 0.45)' });
    });
  });
}

/* ============================================================
   18. Refresh after everything settles
   ============================================================ */
// Trigger positions are measured from layout, so re-measure whenever layout
// can still shift: window load, web fonts swapping in, late images.
const refresh = () => { if (!disposed) ScrollTrigger.refresh(); };
let refreshTimer = 0;
const queueRefresh = () => {
  clearTimeout(refreshTimer); timers.delete(refreshTimer);
  refreshTimer = later(refresh, 120);
};
if (document.readyState === 'complete') queueRefresh();
else addEventListener('load', queueRefresh, sig);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueRefresh);
document.querySelectorAll('#runexe-home-root img').forEach(img => {
  if (img.complete) return;
  img.addEventListener('load', queueRefresh, { once: true });
  img.addEventListener('error', queueRefresh, { once: true });
});

  // Teardown: leave nothing running once the page is left (or re-mounted in dev)
  return () => {
    disposed = true;
    ac.abort();
    tickers.forEach(fn => gsap.ticker.remove(fn));
    timers.forEach(id => clearTimeout(id));
    timers.clear();
    disposers.forEach(fn => { try { fn(); } catch (e) {} });
    ScrollTrigger.killAll();
    gsap.globalTimeline.getChildren().forEach(t => t.kill());
    document.documentElement.style.overflow = '';
  };
}
