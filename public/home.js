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

  /* ---------- the hero deck: swipe, drag, arrows or keys bring the next project forward ---------- */
  const stageEl = document.querySelector('.stage');
  const cards = stageEl ? Array.from(stageEl.querySelectorAll('.deck-card')) : [];
  if (cards.length) {
    const screens = Array.from(stageEl.querySelectorAll('.hero-phone img'));
    const cap = document.querySelector('.deck-cap');
    const link = document.querySelector('.deck-link');
    const count = document.querySelector('.deck-count');
    const N = cards.length;
    const motion = root.classList.contains('motion');

    /* Cards at the back and the other phone screens load once the page has, or on first use. */
    let loadedRest = false;
    const loadRest = () => {
      if (loadedRest) return;
      loadedRest = true;
      stageEl.querySelectorAll('img[data-src]').forEach(img => {
        if (img.dataset.srcset) img.srcset = img.dataset.srcset;
        img.src = img.dataset.src;
        img.removeAttribute('data-src'); img.removeAttribute('data-srcset');
      });
    };
    if (document.readyState === 'complete') setTimeout(loadRest, 800);
    else window.addEventListener('load', () => setTimeout(loadRest, 800), { once: true });
    let active = 0, timer = 0, userDriven = false, visible = true, hovering = false;

    const slotOf = i => { const s = (i - active + N) % N; return s < 3 ? String(s) : 'back'; };
    const paint = () => {
      cards.forEach((c, i) => {
        if (c.dataset.slot !== 'exit') c.dataset.slot = slotOf(i);
        c.setAttribute('aria-hidden', i === active ? 'false' : 'true');
      });
      screens.forEach((s, i) => s.classList.toggle('on', i === active));
      const c = cards[active];
      cap.innerHTML = '';
      const b = document.createElement('b'); b.textContent = c.querySelector('figcaption').textContent;
      const k = document.createElement('span'); k.textContent = c.dataset.kind;
      cap.append(b, k);
      cap.classList.remove('swap'); void cap.offsetWidth; cap.classList.add('swap');
      link.href = c.dataset.url;
      count.textContent = `${active + 1} / ${N}`;
    };

    /* Next: the front card leaves to the left and rejoins at the back once it is out of sight.
       Previous: the card at the back is placed at the left edge, then flies in to the front. */
    const go = dir => {
      loadRest();
      const leaving = cards[active];
      active = (active + dir + N) % N;
      if (dir > 0) {
        leaving.dataset.slot = 'exit';
        setTimeout(() => {
          if (leaving.dataset.slot !== 'exit') return;
          leaving.style.transition = 'none';
          leaving.dataset.slot = slotOf(cards.indexOf(leaving));
          void leaving.offsetWidth;
          leaving.style.transition = '';
        }, 750);
      } else {
        const entering = cards[active];
        entering.style.transition = 'none';
        entering.dataset.slot = 'exit';
        void entering.offsetWidth;
        entering.style.transition = '';
        entering.dataset.slot = '0';
      }
      /* A card still flying out from an earlier quick swipe takes its new place too. */
      cards.forEach(c => { if (c !== leaving && c.dataset.slot === 'exit') c.dataset.slot = ''; });
      paint();
    };

    /* It moves on by itself until the visitor takes over. */
    const stopAuto = () => { clearInterval(timer); timer = 0; };
    const startAuto = () => {
      stopAuto();
      if (!motion || userDriven || !visible || hovering || document.hidden) return;
      timer = setInterval(() => go(1), 5200);
    };
    const takeOver = () => {
      if (!userDriven) { userDriven = true; cap.setAttribute('aria-live', 'polite'); }
      stopAuto();
    };

    document.querySelectorAll('.deck-btn').forEach(btn => btn.addEventListener('click', () => { takeOver(); go(Number(btn.dataset.dir)); }));
    stageEl.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); takeOver(); go(e.key === 'ArrowRight' ? 1 : -1); }
    });

    /* Drag or swipe: the front card follows the finger, and a long enough throw changes project. */
    let startX = 0, startY = 0, dx = 0, pointerId = null, horizontal = false;
    stageEl.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pointerId = e.pointerId; startX = e.clientX; startY = e.clientY; dx = 0; horizontal = false;
    });
    stageEl.addEventListener('pointermove', e => {
      if (e.pointerId !== pointerId) return;
      dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!horizontal) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dy) > Math.abs(dx)) { pointerId = null; return; }
        horizontal = true;
        takeOver();
        stageEl.setPointerCapture(e.pointerId);
        stageEl.classList.add('dragging');
      }
      const front = cards[active];
      front.style.transition = 'none';
      front.style.translate = `${dx}px ${Math.abs(dx) * 0.04}px`;
    });
    const release = e => {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      stageEl.classList.remove('dragging');
      if (!horizontal) return;
      const front = cards[active];
      front.style.transition = '';
      front.style.translate = '';
      if (Math.abs(dx) > 56) go(dx < 0 ? 1 : -1);
    };
    stageEl.addEventListener('pointerup', release);
    stageEl.addEventListener('pointercancel', release);

    stageEl.addEventListener('mouseenter', () => { hovering = true; stopAuto(); });
    stageEl.addEventListener('mouseleave', () => { hovering = false; startAuto(); });
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; startAuto(); }).observe(stageEl);
    document.addEventListener('visibilitychange', startAuto);

    paint();
    cap.classList.remove('swap');
    if (motion) setTimeout(() => { stageEl.classList.add('settled'); startAuto(); }, 3200);
  }

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

  /* Wait briefly for the real fonts, but not long: the width-matched fallbacks look the same
     size, and holding the headline back would delay the page's first meaningful paint. */
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(r => setTimeout(r, 250))]).then(() => {
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
