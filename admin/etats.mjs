// Les états d'une page refaite, dans l'ordre d'affichage des compteurs.
// Les clés sont partagées avec la synchronisation de Jarvis
// (business/agence-web/admin-apercus/sync.py) : en changer une, c'est changer les deux.

export const ETATS = [
  ['non_presentee', 'Pas encore présentée'],
  ['presentee', 'Présentée'],
  ['relancee_1', 'Relancée 1 fois'],
  ['relancee_2', 'Relancée 2 fois'],
  ['interesse', 'A répondu : intéressé'],
  ['refus', 'A répondu : refus'],
  ['desinscrit', 'A répondu : désinscription'],
  ['modification', 'En modification avec le client'],
  ['gardee', 'Gardée, payée'],
  ['retiree', 'Retirée'],
  ['demo', 'Page de démonstration'],
  ['a_poser', 'État à poser'],
];

export const LIBELLES = Object.fromEntries(ETATS);

export function estEtat(cle) {
  return Object.hasOwn(LIBELLES, cle);
}

// L'état qu'on affiche : celui que Nicolas a forcé, sinon celui que Jarvis a calculé.
export function etatEffectif(page, manuel) {
  const force = manuel?.etat_force;
  if (force && estEtat(force.etat)) return { cle: force.etat, le: force.le, force: true };
  const calc = page.etat && estEtat(page.etat.cle) ? page.etat : { cle: 'a_poser' };
  return { cle: calc.cle, le: calc.le || null, source: calc.source || null, force: false };
}

export function correctionsOuvertes(manuel) {
  return (manuel?.corrections || []).filter((c) => !c.faite_le);
}
