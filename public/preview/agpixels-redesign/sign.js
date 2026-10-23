/* The AGPixels sign: a dot-matrix panel that spells what the studio sells.
   Messages rebuild dot by dot; pointing at any [data-sign] element spells it. */
(function () {
  const sign = document.querySelector('.sign');
  if (!sign) return;
  const canvas = sign.querySelector('.sign-canvas');
  const ticksEl = sign.querySelector('.sign-ticks');
  const ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx) return;

  const MESSAGES = ['OTTAWA WEBSITES', 'iOS + ANDROID APPS', 'GOOGLE ADS, FLAT FEE', 'LOVE IT OR PAY $0'];
  const HOLD_MS = 3800;
  const css = getComputedStyle(document.documentElement);
  const C_OFF = css.getPropertyValue('--dot-off').trim() || '#3A30A8';
  const C_ON = css.getPropertyValue('--dot-on').trim() || '#F1EEFF';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  let cols = 0, rows = 0, pitch = 0, radius = 0, dpr = 1, cssW = 0, cssH = 0;
  let target = new Uint8Array(0), level = new Float32Array(0), startAt = new Float32Array(0);
  let cutAt = new Float32Array(0), held = false, started = false;
  let current = '', msgIndex = 0, raf = 0, timer = 0, resumeTimer = 0, pointing = false, visible = true;

  MESSAGES.forEach(() => ticksEl.appendChild(document.createElement('li')));
  const ticks = Array.from(ticksEl.children);

  function layout() {
    const rect = canvas.getBoundingClientRect();
    cssW = rect.width; cssH = rect.height;
    if (!cssW || !cssH) return false;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    rows = cssW < 520 ? 21 : 27;
    pitch = cssH / rows;
    cols = Math.floor(cssW / pitch);
    radius = pitch * 0.36;
    const n = cols * rows;
    target = new Uint8Array(n); level = new Float32Array(n); startAt = new Float32Array(n);
    cutAt = new Float32Array(n).fill(Infinity);
    return true;
  }

  /* Rasterise text at 4x, then average each 4x4 block into one dot. */
  function rasterise(text) {
    const S = 4, w = cols * S, h = rows * S;
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const o = off.getContext('2d');
    o.fillStyle = '#000'; o.textBaseline = 'alphabetic'; o.textAlign = 'center';
    if ('fontStretch' in o) o.fontStretch = 'condensed';
    const family = '"Archivo", sans-serif';

    const fit = (lines, capRatio) => {
      let size = (rows * S) * capRatio / 0.72;
      o.font = `800 ${size}px ${family}`;
      const widest = Math.max(...lines.map(l => o.measureText(l).width));
      const room = (cols - 4) * S;
      if (widest > room) size *= room / widest;
      return size;
    };

    let lines = [text];
    let size = fit(lines, 0.62);
    if (size * 0.72 < rows * S * 0.42 && text.includes(' ')) {
      const words = text.split(' ');
      let best = 1, bestDiff = Infinity;
      for (let i = 1; i < words.length; i++) {
        const diff = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
        if (diff < bestDiff) { bestDiff = diff; best = i; }
      }
      lines = [words.slice(0, best).join(' '), words.slice(best).join(' ')];
      size = fit(lines, 0.3);
    }
    o.font = `800 ${size}px ${family}`;
    const cap = size * 0.72, gap = cap * 0.55;
    const block = lines.length * cap + (lines.length - 1) * gap;
    let y = (h - block) / 2 + cap;
    /* Baselines sit exactly on a dot-row boundary, so round letters' overshoot
       covers too little of the next row to light a stray dot. */
    lines.forEach(line => { o.fillText(line, w / 2, Math.round(y / S) * S); y += cap + gap; });

    const data = o.getImageData(0, 0, w, h).data;
    const out = new Uint8Array(cols * rows);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let a = 0;
        for (let yy = 0; yy < S; yy++) {
          const base = ((r * S + yy) * w + c * S) * 4 + 3;
          for (let xx = 0; xx < S; xx++) a += data[base + xx * 4];
        }
        out[r * cols + c] = a / (S * S * 255) > 0.42 ? 1 : 0;
      }
    }
    return out;
  }

  function show(text, instant) {
    if (!cols || text === current) return;
    current = text;
    target = rasterise(text);
    const now = performance.now();
    const sweep = Math.min(520, cols * 6);
    for (let i = 0; i < target.length; i++) {
      const c = i % cols;
      startAt[i] = instant ? 0 : now + (c / cols) * sweep + Math.random() * 90;
      if (instant) level[i] = target[i];
    }
    const idx = MESSAGES.indexOf(text);
    ticks.forEach((t, i) => t.classList.toggle('on', i === idx));
    kick();
  }

  function draw() {
    const now = performance.now();
    let moving = false;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    const ox = (cssW - cols * pitch) / 2 + pitch / 2, oy = pitch / 2;

    ctx.fillStyle = C_OFF;
    ctx.beginPath();
    for (let i = 0; i < level.length; i++) {
      if (level[i] > 0.98) continue;
      const x = ox + (i % cols) * pitch, y = oy + Math.floor(i / cols) * pitch;
      ctx.moveTo(x + radius, y); ctx.arc(x, y, radius, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.fillStyle = C_ON;
    for (let i = 0; i < level.length; i++) {
      /* A released dot goes dark the instant it leaves the sign. */
      if (cutAt[i] <= now) { level[i] = target[i] = 0; cutAt[i] = Infinity; }
      else if (cutAt[i] !== Infinity) moving = true;
      if (now >= startAt[i]) {
        const d = target[i] - level[i];
        if (Math.abs(d) > 0.01) { level[i] += d * 0.28; moving = true; } else level[i] = target[i];
      } else if (level[i] !== target[i]) moving = true;
      const v = level[i];
      if (v < 0.02) continue;
      const x = ox + (i % cols) * pitch, y = oy + Math.floor(i / cols) * pitch;
      ctx.globalAlpha = v;
      ctx.beginPath(); ctx.arc(x, y, radius * (0.92 + 0.12 * v), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = moving ? requestAnimationFrame(draw) : 0;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(draw); }

  function schedule() {
    clearTimeout(timer);
    if (reduce.matches || pointing || !visible || held) return;
    timer = setTimeout(() => {
      msgIndex = (msgIndex + 1) % MESSAGES.length;
      show(MESSAGES[msgIndex]);
      schedule();
    }, HOLD_MS);
  }

  function point(text) {
    pointing = true; clearTimeout(timer); clearTimeout(resumeTimer);
    show(text, reduce.matches);
  }
  function release() {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      pointing = false;
      show(MESSAGES[msgIndex], reduce.matches);
      schedule();
    }, 1400);
  }
  document.querySelectorAll('[data-sign]').forEach(el => {
    const text = el.getAttribute('data-sign');
    el.addEventListener('mouseenter', () => point(text));
    el.addEventListener('mouseleave', release);
    el.addEventListener('focusin', () => point(text));
    el.addEventListener('focusout', release);
  });

  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    visible ? schedule() : clearTimeout(timer);
  }).observe(sign);

  let resizeTimer = 0;
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      /* Before the fonts are in, start() owns the first layout. */
      if (!started) return;
      const text = current || MESSAGES[0];
      current = '';
      if (layout()) show(text, true);
    }, 120);
  }).observe(canvas);

  /* pixels.js pours the lit dots into the project screens, so it can hold the
     cycle, read where the lit dots are, switch them off as they leave, and relight. */
  let markReady;
  window.agpSign = {
    ready: new Promise(r => { markReady = r; }),
    hold() { held = true; clearTimeout(timer); },
    litDots() {
      const rect = canvas.getBoundingClientRect();
      const ox = rect.left + (cssW - cols * pitch) / 2 + pitch / 2, oy = rect.top + pitch / 2;
      const out = [];
      for (let i = 0; i < target.length; i++) {
        if (target[i] && level[i] > 0.5) out.push({ i, x: ox + (i % cols) * pitch, y: oy + Math.floor(i / cols) * pitch, r: radius });
      }
      return out;
    },
    signBottom() { return sign.getBoundingClientRect().bottom; },
    release(list) {
      list.forEach(d => { cutAt[d.i] = d.t; });
      kick();
    },
    relight() {
      held = false; current = '';
      show(MESSAGES[msgIndex]);
      schedule();
    }
  };

  const start = () => {
    if (!layout()) return;
    started = true;
    sign.classList.add('is-live');
    current = '';
    show(MESSAGES[0], true);
    schedule();
    markReady();
  };
  (document.fonts && document.fonts.load ? document.fonts.load('800 40px "Archivo"').then(() => document.fonts.ready) : Promise.resolve())
    .then(start, start);
})();
