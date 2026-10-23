/* Built pixel by pixel. On load the sign's lit dots pour into the project screens and
   land as coarse pixels that sharpen into the real screenshots. Further down, each
   project sharpens as it scrolls in, and the price board assembles from tiles. */
(function () {
  const root = document.documentElement;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { root.classList.remove('px-intro'); return; }

  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const scratch = document.createElement('canvas');
  const sctx = scratch.getContext('2d', { willReadFrequently: true });
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const css = getComputedStyle(root);
  const DOT_ON = css.getPropertyValue('--dot-on').trim() || '#F1EEFF';
  const VIOLET = [78, 63, 224]; /* --violet-ink: what a pixel looks like in flight */

  /* The part of the image that object-fit: cover shows in a w x h box. */
  function coverSource(img, w, h) {
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const s = Math.max(w / iw, h / ih), sw = w / s, sh = h / s;
    const pos = getComputedStyle(img).objectPosition.split(' ').map(v => parseFloat(v) / 100);
    const px = isNaN(pos[0]) ? 0.5 : pos[0], py = isNaN(pos[1]) ? 0.5 : pos[1];
    return [(iw - sw) * px, (ih - sh) * py, sw, sh];
  }

  /* A canvas over a screenshot that shows it as pixels of any size. */
  class Pixelated {
    constructor(host, img) {
      this.host = host; this.img = img; this.block = 0;
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'px-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      host.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.fit();
    }
    fit() {
      const r = this.host.getBoundingClientRect();
      this.w = r.width; this.h = r.height;
      this.canvas.width = Math.max(1, Math.round(r.width * DPR));
      this.canvas.height = Math.max(1, Math.round(r.height * DPR));
      this.ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      this.block = 0;
    }
    grid(block) { return [Math.max(1, Math.round(this.w / block)), Math.max(1, Math.round(this.h / block))]; }
    /* Average the visible part of the image down to gw x gh pixels. */
    sample(gw, gh) {
      scratch.width = gw; scratch.height = gh;
      sctx.imageSmoothingEnabled = true; sctx.imageSmoothingQuality = 'high';
      const [sx, sy, sw, sh] = coverSource(this.img, this.w, this.h);
      sctx.drawImage(this.img, sx, sy, sw, sh, 0, 0, gw, gh);
      return scratch;
    }
    show(block) {
      if (block === this.block) return;
      if (block <= 1) { this.block = block; this.canvas.classList.add('is-done'); return; }
      if (!this.img.complete || !this.img.naturalWidth) return;
      this.block = block;
      const [gw, gh] = this.grid(block);
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.clearRect(0, 0, this.w, this.h);
      this.ctx.drawImage(this.sample(gw, gh), 0, 0, this.w, this.h);
      this.canvas.classList.remove('is-done');
    }
    remove() { this.canvas.remove(); }
  }

  /* ---------- the pour ---------- */
  async function pour() {
    const hero = document.querySelector('.hero');
    const sign = window.agpSign;
    const screens = Array.from(document.querySelectorAll('.shelf .screen'))
      .filter(el => el.getBoundingClientRect().width > 0)
      .map(el => ({ el, img: el.querySelector('img') }));
    /* Load events, not img.decode(): Chrome never settles decode() called this early. */
    const loaded = Promise.all(screens.map(({ img }) => img.complete ? null : new Promise(r => {
      img.addEventListener('load', r, { once: true });
      img.addEventListener('error', r, { once: true });
    })));
    const ok = hero && sign && screens.length && document.visibilityState === 'visible' &&
      await Promise.race([Promise.all([sign.ready, loaded]).then(() => true), wait(2600).then(() => false)]);
    if (!ok || !root.classList.contains('px-intro') || screens.some(s => !s.img.naturalWidth)) {
      root.classList.remove('px-intro');
      return;
    }

    sign.hold();
    screens.forEach(s => { s.el.classList.add('px-live'); s.px = new Pixelated(s.el, s.img); });
    root.classList.remove('px-intro');
    await wait(900);

    const heroBox = hero.getBoundingClientRect();
    const dots = sign.litDots().sort((a, b) => a.x - b.x);
    const signBottom = sign.signBottom() - heroBox.top;
    const startWidth = window.innerWidth;

    /* One particle per pixel of every screen, in the screenshot's own colours. */
    const targets = [];
    screens.forEach((s, order) => {
      const r = s.el.getBoundingClientRect();
      s.block = clamp(Math.round(r.width / 38), 8, 16);
      [s.gw, s.gh] = s.px.grid(s.block);
      s.cw = r.width / s.gw; s.ch = r.height / s.gh;
      s.pending = s.gw * s.gh;
      s.px.sample(s.gw, s.gh);
      const data = sctx.getImageData(0, 0, s.gw, s.gh).data;
      for (let j = 0; j < s.gh; j++) {
        for (let i = 0; i < s.gw; i++) {
          const k = (j * s.gw + i) * 4;
          targets.push({
            s, i, j, order, row: j / s.gh,
            x: r.left - heroBox.left + (i + 0.5) * s.cw,
            y: r.top - heroBox.top + (j + 0.5) * s.ch,
            rgb: [data[k], data[k + 1], data[k + 2]]
          });
        }
      }
    });

    let relit = false;
    const relight = () => { if (!relit) { relit = true; sign.relight(); } };
    const finish = () => {
      screens.forEach(s => { s.el.classList.remove('px-live'); s.px.remove(); });
      canvas.remove();
      relight();
    };

    const canvas = document.createElement('canvas');
    canvas.className = 'px-pour';
    canvas.setAttribute('aria-hidden', 'true');
    const W = heroBox.width, H = heroBox.height;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    hero.appendChild(canvas);
    const o = canvas.getContext('2d');
    o.setTransform(DPR, 0, 0, DPR, 0, 0);

    if (!dots.length) { finish(); return; }

    /* Dots leave from roughly above where they land, so the pour reads as a flow. */
    const minX = Math.min(...targets.map(t => t.x)), maxX = Math.max(...targets.map(t => t.x));
    const n = dots.length, leaveAt = new Float64Array(n).fill(Infinity);
    const t0 = performance.now() + 30;
    const parts = targets.map(t => {
      const u = (t.x - minX) / Math.max(1, maxX - minX);
      const k = clamp(Math.round(u * (n - 1) + (Math.random() - 0.5) * n * 0.14), 0, n - 1);
      const d = dots[k];
      const sx = d.x - heroBox.left, sy = d.y - heroBox.top;
      const start = t0 + t.order * 70 + t.row * 380 + Math.random() * 160;
      leaveAt[k] = Math.min(leaveAt[k], start);
      const ramp = [];
      for (let q = 0; q <= 5; q++) {
        const f = q / 5;
        ramp.push(`rgb(${VIOLET.map((v, c) => Math.round(v + (t.rgb[c] - v) * f)).join(',')})`);
      }
      return {
        t, sx, sy, start, ramp, d0: d.r * 2, size: Math.max(t.s.cw, t.s.ch),
        dur: 360 + Math.sqrt(Math.max(40, t.y - sy)) * 15 + Math.random() * 80,
        landed: 0
      };
    });
    sign.release(dots.map((d, k) => ({
      i: d.i,
      t: leaveAt[k] === Infinity ? t0 + (k / n) * 520 : leaveAt[k]
    })));

    let landedCount = 0, refined = 0;

    async function refine(s) {
      for (const b of [s.block * 0.5, s.block * 0.25, 2]) {
        await wait(85);
        s.px.show(Math.max(2, b));
      }
      await wait(85);
      s.el.classList.remove('px-live');
      s.px.show(1);
      if (++refined === screens.length) {
        await wait(260);
        screens.forEach(sc => sc.px.remove());
      }
    }

    function land(p, now) {
      const s = p.t.s;
      s.px.ctx.fillStyle = p.ramp[5];
      s.px.ctx.fillRect(p.t.i * s.cw, p.t.j * s.ch, s.cw + 0.6, s.ch + 0.6);
      p.landed = now;
      landedCount++;
      if (--s.pending === 0) refine(s);
    }

    function frame(now) {
      if (window.innerWidth !== startWidth) { finish(); return; }
      o.clearRect(0, 0, W, H);
      let busy = false;
      for (const p of parts) {
        if (p.landed) {
          const q = (now - p.landed) / 170;
          if (q < 1) {
            busy = true;
            o.fillStyle = `rgba(255,255,255,${(0.6 * (1 - q)).toFixed(3)})`;
            o.fillRect(p.t.x - p.t.s.cw / 2, p.t.y - p.t.s.ch / 2, p.t.s.cw, p.t.s.ch);
          }
          continue;
        }
        busy = true;
        if (now < p.start) continue;
        const k = (now - p.start) / p.dur;
        if (k >= 1) { land(p, now); continue; }
        /* Thrown sideways from rest, falling under gravity, growing into its pixel. */
        const x = p.sx + (p.t.x - p.sx) * k;
        const y = p.sy + (p.t.y - p.sy) * k * k;
        const size = p.d0 + (p.size - p.d0) * k * k;
        o.fillStyle = y < signBottom ? DOT_ON : p.ramp[Math.min(5, Math.floor(k * k * 6))];
        o.fillRect(x - size / 2, y - size / 2, size, size);
      }
      /* The sign relights while the last pixels are still landing. */
      if (landedCount >= parts.length * 0.8) relight();
      if (landedCount === parts.length && !busy) { canvas.remove(); return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  pour();

  /* ---------- projects sharpen as they scroll in ---------- */
  const LEVELS = [56, 36, 22, 13, 7, 3, 1];
  const shots = Array.from(document.querySelectorAll('.case-shot')).map(a => {
    const px = new Pixelated(a, a.querySelector('img'));
    px.img.addEventListener('load', () => { px.block = 0; requestUpdate(); });
    return px;
  });
  let pending = false;
  function update() {
    pending = false;
    const vh = window.innerHeight;
    for (const px of shots) {
      const r = px.host.getBoundingClientRect();
      if (r.bottom < -40 || r.top > vh + 40) continue;
      /* Coarse as it enters at the bottom, sharp once its top passes 45% of the screen. */
      const p = clamp((vh - r.top) / (vh * 0.55), 0, 1);
      px.show(LEVELS[Math.min(LEVELS.length - 1, Math.floor(p * LEVELS.length))]);
    }
  }
  function requestUpdate() { if (!pending) { pending = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', requestUpdate, { passive: true });

  /* ---------- the price board assembles from tiles ---------- */
  const board = document.querySelector('.board');
  let cover = null;
  if (board && board.getBoundingClientRect().top > window.innerHeight) {
    const wrap = board.parentElement;
    const M = 44, T = 22;
    let bg = 'transparent';
    for (let el = board.parentElement; el && (bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)'); el = el.parentElement) {
      bg = getComputedStyle(el).backgroundColor;
    }
    cover = document.createElement('canvas');
    cover.className = 'px-cover';
    cover.setAttribute('aria-hidden', 'true');
    wrap.appendChild(cover);
    const ctx = cover.getContext('2d');
    let box;
    const place = () => {
      const wr = wrap.getBoundingClientRect(), br = board.getBoundingClientRect();
      box = { x: br.left - wr.left - M, y: br.top - wr.top - 8, w: br.width + M * 2, h: br.height + 8 + M };
      Object.assign(cover.style, { left: box.x + 'px', top: box.y + 'px', width: box.w + 'px', height: box.h + 'px' });
      cover.width = Math.round(box.w * DPR); cover.height = Math.round(box.h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, box.w, box.h);
    };
    place();
    cover.place = place;

    new IntersectionObserver((entries, io) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      cover.place = null;
      const cols = Math.ceil(box.w / T), rows = Math.ceil(box.h / T);
      const tiles = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          tiles.push({ x: c * T, y: r * T, at: ((c / cols) * 0.6 + (r / rows) * 0.4) * 520 + Math.random() * 240 });
        }
      }
      tiles.sort((a, b) => a.at - b.at);
      const t0 = performance.now();
      let next = 0;
      (function step(now) {
        while (next < tiles.length && tiles[next].at <= now - t0) {
          ctx.clearRect(tiles[next].x, tiles[next].y, T, T);
          next++;
        }
        if (next < tiles.length) requestAnimationFrame(step);
        else cover.remove();
      })(t0);
    }, { rootMargin: '0px 0px -22% 0px' }).observe(board);
  }

  /* Re-measure everything when the width changes (not on mobile URL-bar height changes). */
  let lastWidth = window.innerWidth, resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      shots.forEach(px => px.fit());
      if (cover && cover.place) cover.place();
      update();
    }, 150);
  });
  update();
})();
