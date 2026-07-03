(function () {
  var hdr = document.getElementById('hdr');
  var sentinel = document.getElementById('topSentinel');

  /* Header scrolled : IntersectionObserver sur une sentinelle, jamais de listener scroll */
  if ('IntersectionObserver' in window && sentinel) {
    new IntersectionObserver(function (entries) {
      hdr.classList.toggle('scrolled', !entries[0].isIntersecting);
    }, { rootMargin: '40px 0px 0px 0px' }).observe(sentinel);
  }

  /* Menu mobile */
  var menu = document.getElementById('menu');
  var burger = document.getElementById('burger');
  burger.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  });
  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      menu.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });

  /* Reveal au scroll */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
    /* filet de sécurité : tout révéler après 1,6 s (rendus headless, onglets cachés) */
    setTimeout(function () {
      reveals.forEach(function (el) { el.classList.add('in'); });
    }, 1600);
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* Copier l'email */
  var btn = document.getElementById('copyBtn');
  if (btn && navigator.clipboard) {
    btn.addEventListener('click', function () {
      navigator.clipboard.writeText('nicolas@nicomasset.com').then(function () {
        btn.textContent = 'Copié';
        btn.classList.add('done');
        setTimeout(function () {
          btn.textContent = 'Copier';
          btn.classList.remove('done');
        }, 2200);
      });
    });
  } else if (btn) {
    btn.style.display = 'none';
  }
})();
