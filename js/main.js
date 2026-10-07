/* FR Detailing — interakcije i animacije */
(() => {
  'use strict';

  const d = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = d.classList.contains('reduce-motion');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Duljine putanja za iscrtavanje loga ---------- */
  $$('.lg-sw').forEach((p) => {
    try { p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 2); } catch (e) { /* stari preglednici */ }
  });

  /* ---------- Loader ---------- */
  const t0 = performance.now();
  const ready = () => {
    d.classList.add('is-loaded');
    setTimeout(() => d.classList.add('is-ready'), d.classList.contains('skip-loader') ? 30 : 380);
    try { sessionStorage.setItem('fr-seen', '1'); } catch (e) { /* privatni način */ }
  };
  if (d.classList.contains('skip-loader')) {
    ready();
  } else {
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    const loaded = new Promise((r) => (document.readyState === 'complete' ? r() : window.addEventListener('load', r, { once: true })));
    Promise.race([Promise.all([fonts, loaded]), new Promise((r) => setTimeout(r, 3000))])
      .then(() => setTimeout(ready, Math.max(0, 1400 - (performance.now() - t0))));
  }

  /* ---------- Navigacija i mobilni izbornik ---------- */
  const nav = $('#nav');
  const dock = $('.dock');
  const hero = $('.hero');
  const burger = $('.burger');
  const menu = $('#menu');

  const setMenu = (open) => {
    d.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Zatvori izbornik' : 'Otvori izbornik');
    menu.setAttribute('aria-hidden', String(!open));
    menu.inert = !open;
    if (open) dock.classList.remove('show');
    else update();
  };
  menu.inert = true;
  burger.addEventListener('click', () => setMenu(!d.classList.contains('menu-open')));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && d.classList.contains('menu-open')) setMenu(false); });
  window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  // aktivna poveznica u navigaciji
  const navLinks = $$('.nav-links a');
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['o-nama', 'usluge', 'mobilni', 'rezultati', 'proces', 'kontakt'].forEach((id) => { const s = document.getElementById(id); if (s) sectionIO.observe(s); });

  /* ---------- Otkrivanje pri skrolanju ---------- */
  const revealEls = $$('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('in', 'done'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add('in');
        io.unobserve(el);
        setTimeout(() => el.classList.add('done'), 2400);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Riječi koje se pale dok skrolaš ---------- */
  const wordsEl = $('[data-words]');
  let wordSpans = [];
  if (wordsEl) {
    const words = wordsEl.textContent.trim().split(/\s+/);
    wordsEl.innerHTML = words
      .map((w) => `<span class="w${/^(naš|detalj)/i.test(w) ? ' hl' : ''}">${w}</span>`)
      .join(' ');
    wordSpans = $$('.w', wordsEl);
    if (reduce) wordSpans.forEach((s) => s.classList.add('on'));
  }
  const updateWords = (vh) => {
    if (!wordSpans.length || reduce) return;
    const r = wordsEl.getBoundingClientRect();
    if (r.bottom < -50 || r.top > vh + 50) return;
    const start = vh * 0.88;
    const end = vh * 0.42;
    const p = clamp((start - r.top) / (r.height + start - end), 0, 1);
    const n = Math.round(p * wordSpans.length);
    wordSpans.forEach((s, i) => s.classList.toggle('on', i < n));
  };

  /* ---------- Veliki tekst koji klizi ---------- */
  const megaRows = $$('[data-mega]');
  const updateMega = (vh) => {
    if (reduce) return;
    megaRows.forEach((row) => {
      const r = row.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
      const x = row.dataset.mega === '1' ? -35 + p * 28 : -5 - p * 28;
      row.style.transform = `translate3d(${x.toFixed(2)}%,0,0)`;
    });
  };

  /* ---------- Vremenska crta procesa ---------- */
  const stepsEl = $('[data-steps]');
  const stepItems = stepsEl ? $$('.step', stepsEl) : [];
  const updateSteps = (vh) => {
    if (!stepsEl) return;
    const r = stepsEl.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) return;
    const mark = vh * 0.62;
    stepsEl.style.setProperty('--p', clamp((mark - r.top) / r.height, 0, 1).toFixed(3));
    stepItems.forEach((li) => {
      const n = li.firstElementChild.getBoundingClientRect();
      li.classList.toggle('on', n.top + n.height / 2 < mark);
    });
  };
  if (reduce) stepItems.forEach((li) => li.classList.add('on'));

  /* ---------- Glavna petlja skrolanja ---------- */
  let ticking = false;
  function update() {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;
    nav.classList.toggle('scrolled', y > 24);
    dock.classList.toggle('show', y > vh * 0.65 && !d.classList.contains('menu-open'));
    if (!reduce && y < vh * 1.3) hero.style.setProperty('--hp', clamp(y / vh, 0, 1).toFixed(3));
    updateWords(vh);
    updateMega(vh);
    updateSteps(vh);
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();

  /* ---------- Prije / poslije klizači ---------- */
  $$('[data-ba]').forEach((ba) => {
    const handle = $('.ba-handle', ba);
    let pos = 50;
    let state = null; // null | 'pending' | 'drag'
    let sx = 0;
    let sy = 0;
    let touched = false;
    let raf = null;

    const set = (v) => {
      pos = clamp(v, 0, 100);
      ba.style.setProperty('--pos', pos.toFixed(2) + '%');
      handle.setAttribute('aria-valuenow', String(Math.round(pos)));
      ba.classList.toggle('hide-before', pos < 20);
      ba.classList.toggle('hide-after', pos > 80);
    };
    const fromX = (x) => { const r = ba.getBoundingClientRect(); return ((x - r.left) / r.width) * 100; };
    const touch = () => { touched = true; ba.classList.add('touched'); if (raf) cancelAnimationFrame(raf); raf = null; };

    ba.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return;
      sx = e.clientX; sy = e.clientY;
      if (e.pointerType === 'mouse') {
        state = 'drag';
        touch();
        ba.classList.add('dragging');
        ba.setPointerCapture(e.pointerId);
        set(fromX(e.clientX));
      } else {
        state = 'pending';
      }
    });
    ba.addEventListener('pointermove', (e) => {
      if (state === 'pending') {
        const dx = Math.abs(e.clientX - sx);
        const dy = Math.abs(e.clientY - sy);
        if (dx > 6 && dx > dy) {
          state = 'drag';
          touch();
          ba.classList.add('dragging');
          try { ba.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        } else if (dy > 10) {
          state = null;
        }
      }
      if (state === 'drag') set(fromX(e.clientX));
    });
    const end = () => { state = null; ba.classList.remove('dragging'); };
    ba.addEventListener('pointerup', end);
    ba.addEventListener('pointercancel', end);
    ba.addEventListener('lostpointercapture', (e) => { if (e.target === ba) end(); });

    handle.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 10 : 4;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') set(pos - step);
      else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') set(pos + step);
      else if (e.key === 'Home') set(0);
      else if (e.key === 'End') set(100);
      else return;
      e.preventDefault();
      touch();
    });

    // kratka demonstracija kad klizač uđe u ekran
    if (!reduce && 'IntersectionObserver' in window) {
      const demoIO = new IntersectionObserver(([en]) => {
        if (!en.isIntersecting) return;
        demoIO.disconnect();
        setTimeout(() => { if (!touched) demo(); }, 450);
      }, { threshold: 0.65 });
      demoIO.observe(ba);
    }
    function demo() {
      const keys = [[0, 50], [750, 16], [1700, 84], [2500, 50]];
      const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      const start = performance.now();
      const tick = (now) => {
        const t = now - start;
        const i = keys.findIndex((k) => k[0] > t);
        if (i === -1) { set(50); raf = null; return; }
        const [ta, pa] = keys[i - 1];
        const [tb, pb] = keys[i];
        set(pa + (pb - pa) * ease((t - ta) / (tb - ta)));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
  });

  /* ---------- Čestice u heroju ---------- */
  const cv = $('.particles');
  if (cv && !reduce && cv.getContext) {
    const ctx = cv.getContext('2d');
    const N = window.innerWidth < 700 ? 34 : 72;
    let w = 0;
    let h = 0;
    let parts = [];
    let running = false;
    let raf = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nw = cv.clientWidth;
      const nh = cv.clientHeight;
      if (nw === w && nh === h) return;
      w = nw; h = nh;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const spawn = (init) => ({
      x: Math.random() * w,
      y: init ? Math.random() * h : h + 10,
      r: Math.random() * 1.5 + 0.4,
      vx: (Math.random() - 0.5) * 0.16,
      vy: -(Math.random() * 0.32 + 0.1),
      a: Math.random() * 0.55 + 0.2,
      tw: Math.random() * Math.PI * 2,
    });
    resize();
    parts = Array.from({ length: N }, () => spawn(true));
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.tw += 0.025;
        if (p.y < -10) Object.assign(p, spawn(false));
        const a = p.a * (0.55 + 0.45 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3.2, 0, 6.2832);
        ctx.fillStyle = `rgba(60,130,255,${(a * 0.18).toFixed(3)})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fillStyle = `rgba(190,220,255,${a.toFixed(3)})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !running) { running = true; tick(); }
      else if (!en.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
    }).observe(cv);
    window.addEventListener('resize', resize, { passive: true });
  }

  /* ---------- Desktop: reflektor na karticama, magnetni gumbi, nagib loga ---------- */
  if (finePointer) {
    $$('.card').forEach((c) => {
      c.addEventListener('pointermove', (e) => {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--mx', `${e.clientX - r.left}px`);
        c.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });

    if (!reduce) {
      $$('.magnetic').forEach((b) => {
        b.addEventListener('pointermove', (e) => {
          const r = b.getBoundingClientRect();
          const x = (e.clientX - r.left - r.width / 2) * 0.22;
          const y = (e.clientY - r.top - r.height / 2) * 0.35;
          b.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        });
        b.addEventListener('pointerleave', () => { b.style.transform = ''; });
      });

      const logo = $('.logo-svg');
      hero.addEventListener('pointermove', (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        logo.style.setProperty('--tx', `${(nx * 10).toFixed(2)}deg`);
        logo.style.setProperty('--ty', `${(-ny * 8).toFixed(2)}deg`);
      });
      hero.addEventListener('pointerleave', () => {
        logo.style.setProperty('--tx', '0deg');
        logo.style.setProperty('--ty', '0deg');
      });
    }
  }

  /* ---------- Mobilni detailing: SMIL animacija rute ---------- */
  const route = $('.route');
  if (route && route.pauseAnimations) {
    if (reduce) route.pauseAnimations();
    else new IntersectionObserver(([en]) => (en.isIntersecting ? route.unpauseAnimations() : route.pauseAnimations())).observe(route);
  }

  /* ---------- Godina u podnožju ---------- */
  const yr = $('[data-year]');
  if (yr) yr.textContent = String(new Date().getFullYear());
})();
