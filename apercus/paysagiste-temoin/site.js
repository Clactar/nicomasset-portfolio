/* Site témoin paysagiste « Terre & Sève », v1 (2026-09-10). En-tête au défilement, menu mobile,
   apparition des blocs, compteurs des fiches de chantier, formulaire de démonstration. */
(function () {
  var h = document.querySelector('header'), b = document.querySelector('.burger'), m = document.getElementById('menu');
  function onScroll() { h.classList.toggle('scrolled', window.scrollY > 24); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  if (b && m) {
    b.addEventListener('click', function () {
      var o = !m.classList.contains('open');
      m.classList.toggle('open', o); b.setAttribute('aria-expanded', o);
      b.setAttribute('aria-label', o ? 'Fermer le menu' : 'Ouvrir le menu');
      document.body.classList.toggle('menu-open', o);
    });
    m.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { m.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); document.body.classList.remove('menu-open'); });
    });
  }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els = document.querySelectorAll('.rv');
  function count(el) {
    var target = parseInt(el.getAttribute('data-n'), 10), t0 = null, dur = 900;
    if (reduce || isNaN(target)) { el.firstChild.nodeValue = target; return; }
    function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / dur); p = 1 - Math.pow(1 - p, 3); el.firstChild.nodeValue = Math.round(target * p); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          e.target.querySelectorAll('[data-n]').forEach(count);
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  } else {
    els.forEach(function (e) { e.classList.add('in'); e.querySelectorAll('[data-n]').forEach(function (n) { n.firstChild.nodeValue = n.getAttribute('data-n'); }); });
  }
  var f = document.getElementById('form');
  if (f) f.addEventListener('submit', function (e) { e.preventDefault(); this.classList.add('sent'); this.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' }); });
})();
