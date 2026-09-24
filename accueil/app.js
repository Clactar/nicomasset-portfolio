(() => {
  const epreuve = document.getElementById('adeline');
  if (!epreuve) return;
  const boutons = epreuve.querySelectorAll('.bascule button');
  const montrer = (etat) => {
    epreuve.dataset.etat = etat;
    boutons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.vers === etat)));
    epreuve.querySelector('.url--avant').hidden = etat !== 'avant';
    epreuve.querySelector('.url--apres').hidden = etat !== 'apres';
    epreuve.querySelector('.notes--avant').hidden = etat !== 'avant';
    epreuve.querySelector('.notes--apres').hidden = etat !== 'apres';
  };
  boutons.forEach(b => b.addEventListener('click', () => montrer(b.dataset.vers)));
  const poser = () => epreuve.classList.add('pose');

  // lien du héros : montre la nouvelle page et cadre le téléphone entier, bascule comprise si la place le permet
  const lien = document.querySelector('a[data-montrer]');
  if (lien) lien.addEventListener('click', (e) => {
    e.preventDefault();
    montrer(lien.dataset.montrer);
    poser();
    const haut = document.querySelector('.entete').getBoundingClientRect().height + 12;
    const place = innerHeight - haut - 12;
    const bascule = epreuve.querySelector('.bascule').getBoundingClientRect();
    const planche = epreuve.querySelector('.planche').getBoundingClientRect();
    const debut = planche.bottom - bascule.top <= place ? bascule.top : planche.top;
    const cible = Math.max(0, scrollY + debut - haut);
    const doux = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollTo({top: cible, behavior: doux ? 'smooth' : 'auto'});
    epreuve.querySelector('.bascule [data-vers="' + lien.dataset.montrer + '"]').focus({preventScroll: true});
  });

  if (!('IntersectionObserver' in window)) return poser();
  const io = new IntersectionObserver((entrees) => {
    if (entrees.some(e => e.isIntersecting)) { setTimeout(poser, 250); io.disconnect(); }
  }, {threshold: 0.4});
  io.observe(epreuve.querySelector('.telephone'));
})();
