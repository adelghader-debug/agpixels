/* Mobile menu toggle. Divi's own mobile menu replaces this on the live site. */
(function () {
  var btn = document.querySelector('nav .menu');
  var nav = document.querySelector('nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? 'Close' : 'Menu';
  });
})();
