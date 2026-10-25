/* Landing-page hero stack: the homepage deck's moves (home.js) without its controls. The client
   sites fly in from depth, the stack turns gently toward the pointer, and every few seconds the
   front site steps aside and rejoins at the back. Decorative (aria-hidden) and desktop only. */
(function () {
  const root = document.documentElement;
  const stack = document.querySelector('.hero-stack');
  if (!stack || !root.classList.contains('motion')) return;
  const inner = stack.querySelector('.hs-inner');
  const cards = Array.from(stack.querySelectorAll('.hs-win'));
  const N = cards.length;

  /* Start the entrance once the screenshots have arrived, but never wait long for them. */
  const arrived = cards.map(c => c.querySelector('img')).map(img => img.complete ? Promise.resolve() : new Promise(r => {
    img.addEventListener('load', r, { once: true });
    img.addEventListener('error', r, { once: true });
  }));
  Promise.race([Promise.all(arrived), new Promise(r => setTimeout(r, 900))]).then(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('ready')));
  });

  /* Next: the front site leaves to the left, drops in behind the stack once it is out of sight,
     then moves up into its new place while the others come forward. */
  let active = 0, timer = 0, visible = false, settled = false;
  const slotOf = i => { const s = (i - active + N) % N; return s < 3 ? String(s) : 'back'; };
  const next = () => {
    const leaving = cards[active];
    active = (active + 1) % N;
    leaving.dataset.slot = 'exit';
    cards.forEach((c, i) => { if (c !== leaving) c.dataset.slot = slotOf(i); });
    setTimeout(() => {
      leaving.style.transition = 'none';
      leaving.dataset.slot = 'back';
      void leaving.offsetWidth;
      leaving.style.transition = '';
      leaving.dataset.slot = slotOf(cards.indexOf(leaving));
    }, 750);
  };

  /* It only moves while it is on screen (phones never show it). */
  const stop = () => { clearInterval(timer); timer = 0; };
  const start = () => {
    stop();
    if (settled && visible && !document.hidden && N > 1) timer = setInterval(next, 5200);
  };
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; start(); }).observe(stack);
  document.addEventListener('visibilitychange', start);
  setTimeout(() => { settled = true; stack.classList.add('settled'); start(); }, 3200);

  /* The stack turns gently toward the pointer. */
  if (!window.matchMedia('(pointer: fine)').matches) return;
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  const loop = () => {
    cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
    inner.style.setProperty('--tx', cx.toFixed(2) + 'deg');
    inner.style.setProperty('--ty', cy.toFixed(2) + 'deg');
    raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.01 ? requestAnimationFrame(loop) : 0;
  };
  window.addEventListener('pointermove', e => {
    tx = (e.clientX / window.innerWidth - 0.5) * 8;
    ty = -(e.clientY / window.innerHeight - 0.5) * 6;
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
})();
