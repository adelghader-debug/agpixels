/* Mobile menu: full-screen panel. Divi's own mobile menu replaces this on the live site. */
(function () {
  var nav = document.querySelector('nav');
  var btn = nav && nav.querySelector('.menu');
  if (!btn) return;
  function set(open) {
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  btn.addEventListener('click', function () { set(!nav.classList.contains('is-open')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  nav.querySelectorAll('.links a').forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
})();
