(function () {
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header scrolled : IntersectionObserver, jamais de listener scroll ---------- */
  var hdr = document.getElementById('hdr');
  var sentinel = document.getElementById('topSentinel');
  if ('IntersectionObserver' in window && sentinel) {
    new IntersectionObserver(function (entries) {
      hdr.classList.toggle('scrolled', !entries[0].isIntersecting);
    }, { rootMargin: '40px 0px 0px 0px' }).observe(sentinel);
  }

  /* ---------- Halo qui suit le curseur (lerp, transform only) ---------- */
  var halo = document.getElementById('halo');
  if (halo && fine && !reduce) {
    var hx = innerWidth / 2, hy = innerHeight / 3, tx = hx, ty = hy, raf = null;
    var tick = function () {
      hx += (tx - hx) * 0.09;
      hy += (ty - hy) * 0.09;
      halo.style.transform = 'translate(' + (hx - 320) + 'px,' + (hy - 320) + 'px)';
      if (Math.abs(tx - hx) + Math.abs(ty - hy) > 0.3) { raf = requestAnimationFrame(tick); }
      else { raf = null; }
    };
    addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      document.body.classList.add('halo-on');
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }

  /* ---------- Tilt 3D des captures (panels) ---------- */
  if (fine && !reduce) {
    document.querySelectorAll('.tilt').forEach(function (zone) {
      var card = zone.querySelector('.panel-shot');
      zone.addEventListener('pointermove', function (e) {
        var r = zone.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;   /* 0..1 */
        var py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--rx', ((px - 0.5) * 8).toFixed(2) + 'deg');
        card.style.setProperty('--ry', ((0.5 - py) * 8).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      }, { passive: true });
      zone.addEventListener('pointerleave', function () {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });

    /* ---------- Bord lumineux des cartes maquettes ---------- */
    document.querySelectorAll('.mock').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
      }, { passive: true });
    });

    /* ---------- Boutons magnétiques ---------- */
    document.querySelectorAll('.magnet').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + (dx * 0.22).toFixed(1) + 'px,' + (dy * 0.28).toFixed(1) + 'px)';
      }, { passive: true });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- Pause du film hero hors écran (batterie mobile) ---------- */
  var film = document.querySelector('.film');
  if (film && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      film.classList.toggle('paused', !entries[0].isIntersecting);
    }).observe(film);
  }

  /* ---------- Menu mobile ---------- */
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

  /* ---------- Reveal au scroll ---------- */
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

  /* ---------- Copier l'email ---------- */
  var btn = document.getElementById('copyBtn');
  if (btn && navigator.clipboard) {
    btn.addEventListener('click', function () {
      navigator.clipboard.writeText('nicolas@nicomasset.com').then(function () {
        btn.textContent = 'Adresse copiée';
        btn.classList.add('done');
        setTimeout(function () {
          btn.textContent = 'Copier l\u2019adresse';
          btn.classList.remove('done');
        }, 2200);
      });
    });
  } else if (btn) {
    btn.style.display = 'none';
  }
})();
