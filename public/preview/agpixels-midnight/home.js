/* Midnight motion: the hero entrance, the project stack following the pointer, work
   that tilts flat as it scrolls in, section reveals, and a soft light under the cursor.
   Forms, the mobile menu, the sticky button and the footer year live in /script.js. */
(function () {
  const root = document.documentElement;
  const fine = window.matchMedia('(pointer: fine)').matches;

  const header = document.querySelector('.site-header');
  const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!root.classList.contains('motion')) return;

  /* Wrap each headline word so it can rise through its own mask. */
  const title = document.querySelector('.hero-title');
  if (title) {
    title.setAttribute('aria-label', title.textContent);
    let i = 0;
    const wrapWords = node => {
      Array.from(node.childNodes).forEach(child => {
        if (child.nodeType === 1) { wrapWords(child); return; }
        if (child.nodeType !== 3) return;
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const w = document.createElement('span');
          w.className = 'w';
          w.setAttribute('aria-hidden', 'true');
          const inner = document.createElement('span');
          inner.textContent = part;
          inner.style.setProperty('--i', i++);
          w.appendChild(inner);
          frag.appendChild(w);
        });
        child.replaceWith(frag);
      });
    };
    wrapWords(title);
  }

  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(r => setTimeout(r, 1200))]).then(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('ready')));
  });

  /* Sections fade up once; rows, steps and reviews arriving together are staggered. */
  document.querySelectorAll('.rows, .steps, .quotes').forEach(group => {
    Array.from(group.children).forEach((el, k) => { el.style.transitionDelay = (k % 4) * 80 + 'ms'; });
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

  /* Each project leans back as it enters and lies flat by the time it is well in view. */
  const tilts = Array.from(document.querySelectorAll('[data-tilt]'));
  let pending = false;
  const update = () => {
    pending = false;
    const vh = window.innerHeight;
    tilts.forEach(el => {
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.62)));
      el.style.setProperty('--p', p.toFixed(3));
    });
  };
  const request = () => { if (!pending) { pending = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();

  if (!fine) return;

  /* The hero stack turns gently toward the pointer. */
  const stage = document.querySelector('.stage-inner');
  let tx = 0, ty = 0, cx = 0, cy = 0, stageRaf = 0;
  const stageLoop = () => {
    cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
    stage.style.setProperty('--tx', cx.toFixed(2) + 'deg');
    stage.style.setProperty('--ty', cy.toFixed(2) + 'deg');
    stageRaf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.01 ? requestAnimationFrame(stageLoop) : 0;
  };

  /* A soft light follows the cursor across the dark page. */
  const spot = document.querySelector('.spot');
  let x = 0, y = 0, sx = 0, sy = 0, spotRaf = 0;
  const spotLoop = () => {
    sx += (x - sx) * 0.14; sy += (y - sy) * 0.14;
    spot.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
    spotRaf = Math.abs(x - sx) + Math.abs(y - sy) > 0.5 ? requestAnimationFrame(spotLoop) : 0;
  };

  window.addEventListener('pointermove', e => {
    if (stage) {
      tx = (e.clientX / window.innerWidth - 0.5) * 8;
      ty = -(e.clientY / window.innerHeight - 0.5) * 6;
      if (!stageRaf) stageRaf = requestAnimationFrame(stageLoop);
    }
    if (spot) {
      if (!spot.classList.contains('on')) { sx = x = e.clientX; sy = y = e.clientY; spot.classList.add('on'); }
      x = e.clientX; y = e.clientY;
      if (!spotRaf) spotRaf = requestAnimationFrame(spotLoop);
    }
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => spot && spot.classList.remove('on'));
})();
