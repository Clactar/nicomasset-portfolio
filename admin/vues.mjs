// Les écrans de l'admin, rendus côté serveur, sans JavaScript.
// Charte du site (DESIGN.md) : papier froid, encre verte, surligneur réservé à ce qui est marqué.

import { ETATS, LIBELLES, etatEffectif, correctionsOuvertes } from './etats.mjs';

const echapper = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const FUSEAU = 'Europe/Paris';
export function dateCourte(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return echapper(iso);
  return d.toLocaleDateString('fr-FR', { timeZone: FUSEAU, day: '2-digit', month: '2-digit', year: 'numeric' });
}
export function dateHeure(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return echapper(iso);
  const j = d.toLocaleDateString('fr-FR', { timeZone: FUSEAU, day: '2-digit', month: '2-digit', year: 'numeric' });
  const h = d.toLocaleTimeString('fr-FR', { timeZone: FUSEAU, hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
  // Une date sans heure (AAAA-MM-JJ) reste une date.
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? j : `${j} à ${h}`;
}

// « 09h16 » si c'est aujourd'hui, sinon « 25/10 09h16 » : l'en-tête doit tenir sur une ligne au téléphone.
function heureCourte(iso, maintenant = new Date()) {
  const d = new Date(iso);
  const jour = (x) => x.toLocaleDateString('fr-FR', { timeZone: FUSEAU, day: '2-digit', month: '2-digit' });
  const h = d.toLocaleTimeString('fr-FR', { timeZone: FUSEAU, hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
  return jour(d) === jour(maintenant) ? h : `${jour(d)} ${h}`;
}

const PAYS = { FR: 'France', US: 'États-Unis' };

const STYLE = `
@font-face{font-family:"Familjen";src:url(/accueil/fonts/familjen.woff2) format("woff2");font-weight:400 700;font-display:swap}
@font-face{font-family:"Newsreader";src:url(/accueil/fonts/newsreader.woff2) format("woff2");font-weight:200 800;font-display:swap}
:root{--papier:#EEF0EB;--papier-clair:#F8F9F6;--encre:#18221D;--encre-douce:#4E5A53;--surligneur:#F2DF4A;--filet:#D5DAD2;--rouge:#B3261E;--vert:#1D6B3C}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--papier);color:var(--encre);font:400 17px/1.5 "Newsreader",Georgia,serif}
a{color:inherit}
h1,h2,h3,.g{font-family:"Familjen",system-ui,sans-serif;font-weight:600;line-height:1.1;text-wrap:balance}
h1{font-size:28px;margin:0}
h2{font-size:20px;margin:0 0 12px}
.page{max-width:1200px;margin:0 auto;padding:0 16px 96px}
.tete{position:sticky;top:0;z-index:2;background:var(--papier);border-bottom:1px solid var(--filet)}
.tete .page{display:flex;align-items:center;gap:12px;padding-top:12px;padding-bottom:12px}
.tete .titre{font-family:"Familjen",system-ui,sans-serif;font-weight:600;font-size:18px;text-decoration:none;flex:1;white-space:nowrap}
.synchro{color:var(--encre-douce);font-size:14px;white-space:nowrap}
button,.bouton{font:600 15px/1 "Familjen",system-ui,sans-serif;border-radius:999px;border:0;padding:12px 18px;min-height:44px;background:var(--encre);color:var(--papier-clair);cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:6px}
button.doux,.bouton.doux{background:transparent;color:var(--encre);box-shadow:inset 0 0 0 1.5px var(--encre)}
button.petit{padding:8px 14px;min-height:36px;font-size:14px}
button.danger{background:var(--rouge)}
.compteurs{display:flex;gap:8px;overflow-x:auto;padding:16px 0 4px;margin:0 -16px;padding-left:16px;padding-right:16px;scrollbar-width:none}
.puce{flex:none;font:500 14px/1 "Familjen",system-ui,sans-serif;padding:10px 14px;border-radius:999px;background:var(--papier-clair);text-decoration:none;white-space:nowrap}
.puce b{font-weight:600;margin-left:6px}
.puce.actif{background:var(--encre);color:var(--papier-clair)}
.puce.alerte b{background:var(--surligneur);color:var(--encre);padding:2px 6px;border-radius:4px}
.reglages{display:flex;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;white-space:nowrap;margin:0 -16px;padding-left:16px!important;padding-right:16px!important;gap:8px 16px;align-items:center;padding:12px 0 20px;font:500 14px/1.2 "Familjen",system-ui,sans-serif;color:var(--encre-douce)}
.reglages a{text-decoration:none;padding:6px 0}
.reglages a.actif{color:var(--encre);text-decoration:underline;text-underline-offset:4px;text-decoration-thickness:2px}
.reglages .sep{flex:none;width:1px;height:16px;background:var(--filet)}
@media(min-width:720px){.compteurs{flex-wrap:wrap;overflow:visible}}
.grille{display:grid;grid-template-columns:1fr;gap:12px}
@media(max-width:719px){.carte{display:grid;grid-template-columns:104px 1fr}.carte>a.corps{display:contents}.carte .vignette{grid-row:1/3;aspect-ratio:auto;height:100%;min-height:150px}.carte .infos{padding:12px 14px 2px;gap:4px}.carte .nom{font-size:17px}.carte .lieu{font-size:14px}.carte .etat{font-size:13px;padding:4px 8px}.carte .pied{grid-column:2;padding:6px 14px 12px;font-size:13px}}
@media(min-width:720px){.grille{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1100px){.grille{grid-template-columns:repeat(3,1fr);gap:24px}h1{font-size:35px}}
.carte{background:var(--papier-clair);border-radius:6px;overflow:hidden;display:flex;flex-direction:column}
.carte>a.corps{text-decoration:none;display:flex;flex-direction:column;flex:1}
.vignette{aspect-ratio:16/10;background:var(--filet);display:block;width:100%;object-fit:cover;object-position:top}
.vignette.vide{display:flex;align-items:center;justify-content:center;font:600 28px "Familjen",system-ui,sans-serif;color:var(--encre-douce)}
.infos{padding:14px 16px 4px;display:flex;flex-direction:column;gap:6px}
.nom{font:600 18px/1.2 "Familjen",system-ui,sans-serif}
.lieu{color:var(--encre-douce);font-size:15px}
.etat{display:inline-flex;align-items:center;gap:6px;font:500 14px/1.2 "Familjen",system-ui,sans-serif;align-self:flex-start;padding:6px 10px;border-radius:6px;background:var(--papier);margin-top:4px}
.etat .pastille{width:8px;height:8px;border-radius:50%;background:var(--encre-douce)}
.etat.interesse .pastille,.etat.gardee .pastille,.etat.modification .pastille{background:var(--vert)}
.etat.refus .pastille,.etat.desinscrit .pastille,.etat.retiree .pastille{background:var(--rouge)}
.etat.a_poser .pastille{background:transparent;box-shadow:inset 0 0 0 1.5px var(--encre-douce)}
.marque{font:500 13px/1.2 "Familjen",system-ui,sans-serif;background:var(--surligneur);padding:3px 6px;border-radius:4px;align-self:flex-start}
.pied{display:flex;justify-content:space-between;align-items:center;padding:10px 16px 14px;color:var(--encre-douce);font-size:14px}
.pied a{font:500 14px "Familjen",system-ui,sans-serif;color:var(--encre)}
.vide-liste{padding:48px 0;color:var(--encre-douce)}
.retour{display:inline-block;padding:16px 0 8px;font:500 15px "Familjen",system-ui,sans-serif;text-decoration:none;color:var(--encre-douce)}
.fiche{display:grid;gap:24px;grid-template-columns:1fr}
@media(min-width:1000px){.fiche{grid-template-columns:5fr 7fr;align-items:start}.fiche .col-image{position:sticky;top:80px}}
.bloc{background:var(--papier-clair);border-radius:6px;padding:20px 16px}
.bloc+.bloc{margin-top:16px}
.bloc p{margin:0 0 12px}
.doux-texte{color:var(--encre-douce);font-size:15px}
.flash{background:var(--surligneur);padding:10px 14px;border-radius:6px;font:500 15px "Familjen",system-ui,sans-serif;margin:8px 0 0}
label{display:block;font:500 14px "Familjen",system-ui,sans-serif;color:var(--encre-douce);margin-bottom:6px}
select,textarea,input[type=text],input[type=password]{width:100%;font:400 17px/1.4 "Newsreader",Georgia,serif;color:var(--encre);background:#fff;border:1.5px solid var(--filet);border-radius:6px;padding:10px 12px}
select{font-family:"Familjen",system-ui,sans-serif;font-size:16px;min-height:44px}
textarea{min-height:96px;resize:vertical}
.ligne{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px}
.case{display:flex;gap:10px;align-items:flex-start;font:400 16px/1.4 "Newsreader",Georgia,serif;color:var(--encre);margin:0 0 12px}
.case input{width:22px;height:22px;margin:0;flex:none}
ul.histo{list-style:none;margin:0;padding:0}
ul.histo li{padding:10px 0;border-top:1px solid var(--filet);display:grid;gap:2px}
ul.histo li:first-child{border-top:0;padding-top:0}
ul.histo time{font:500 13px "Familjen",system-ui,sans-serif;color:var(--encre-douce)}
.correction{padding:12px 0;border-top:1px solid var(--filet)}
.correction:first-of-type{border-top:0}
.connexion{max-width:400px;margin:0 auto;padding:96px 16px}
.connexion form{display:grid;gap:16px;margin-top:24px}
.erreur{color:var(--rouge);font:500 15px "Familjen",system-ui,sans-serif}
.image-grande{width:100%;border-radius:6px;display:block;background:var(--filet);aspect-ratio:390/600;object-fit:cover;object-position:top}
.mails{font-family:"Familjen",system-ui,sans-serif;font-size:15px;word-break:break-all}
`;

function gabarit(titre, corps) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#EEF0EB">
<title>${echapper(titre)} · admin nicomasset.com</title><style>${STYLE}</style></head><body>${corps}</body></html>`;
}

function entete(instantane) {
  let synchro = '';
  if (instantane) synchro = instantane.genere_le ? `Synchro ${heureCourte(instantane.genere_le)}` : 'Jamais synchronisée';
  return `<header class="tete"><div class="page"><a class="titre" href="/admin">Pages refaites</a>
${synchro ? `<span class="synchro">${synchro}</span>` : ''}
<form method="post" action="/admin/deconnexion"><button class="doux petit" type="submit">Sortir</button></form></div></header>`;
}

export function pageErreur(message) {
  return gabarit('Erreur', `<main class="connexion"><h1>${echapper(message)}</h1><p><a href="/admin">Retour à la liste</a></p></main>`);
}

export function pageConnexion({ erreur }) {
  return gabarit('Connexion', `<main class="connexion"><h1>Pages refaites</h1>
<p class="doux-texte">Espace réservé à Nicolas.</p>
<form method="post" action="/admin/connexion">
${erreur ? `<p class="erreur" role="alert">${echapper(erreur)}</p>` : ''}
<div><label for="identifiant">Identifiant</label><input id="identifiant" name="identifiant" type="text" autocomplete="username" autocapitalize="none" required></div>
<div><label for="mdp">Mot de passe</label><input id="mdp" name="mot_de_passe" type="password" autocomplete="current-password" required></div>
<button type="submit">Se connecter</button></form></main>`);
}

function badge(etat) {
  return `<span class="etat ${echapper(etat.cle)}"><span class="pastille"></span>${echapper(LIBELLES[etat.cle])}${etat.force ? ' · forcé' : ''}</span>`;
}

function vignette(page, classe = 'vignette') {
  if (page.vignette) return `<img class="${classe}" src="/admin/vignette/${echapper(page.slug)}?v=${echapper(page.vignette)}" alt="" loading="lazy">`;
  const initiale = (page.nom || page.slug).trim().charAt(0).toUpperCase();
  return `<div class="${classe} vide" aria-hidden="true">${echapper(initiale)}</div>`;
}

function lien(filtres, change) {
  const f = { ...filtres, ...change };
  const q = new URLSearchParams();
  if (f.etat) q.set('etat', f.etat);
  if (f.pays) q.set('pays', f.pays);
  if (f.tri && f.tri !== 'recent') q.set('tri', f.tri);
  if (f.signale) q.set('signale', '1');
  const s = q.toString();
  return `/admin${s ? `?${s}` : ''}`;
}

export function trierEtFiltrer(pages, manuel, filtres) {
  const lignes = pages.map((page) => ({
    page,
    etat: etatEffectif(page, manuel[page.slug]),
    aCorriger: correctionsOuvertes(manuel[page.slug]).length,
    retrait: manuel[page.slug]?.retrait && !manuel[page.slug].retrait.applique_le ? manuel[page.slug].retrait : null,
  }));
  const parPays = filtres.pays ? lignes.filter((l) => l.page.pays === filtres.pays) : lignes;
  const comptes = {};
  for (const l of parPays) comptes[l.etat.cle] = (comptes[l.etat.cle] || 0) + 1;
  const signales = parPays.filter((l) => l.aCorriger).length;
  let vues = parPays;
  if (filtres.etat) vues = vues.filter((l) => l.etat.cle === filtres.etat);
  if (filtres.signale) vues = vues.filter((l) => l.aCorriger);
  const cle = (l) => l.page.cree_le || '';
  if (filtres.tri === 'ancien') vues = [...vues].sort((a, b) => cle(a).localeCompare(cle(b)));
  else if (filtres.tri === 'nom') vues = [...vues].sort((a, b) => (a.page.nom || a.page.slug).localeCompare(b.page.nom || b.page.slug, 'fr'));
  else vues = [...vues].sort((a, b) => cle(b).localeCompare(cle(a)));
  return { vues, comptes, total: parPays.length, signales };
}

export function pageListe({ instantane, manuel, filtres }) {
  const { vues, comptes, total, signales } = trierEtFiltrer(instantane.pages, manuel, filtres);
  const puces = [
    `<a class="puce${!filtres.etat && !filtres.signale ? ' actif' : ''}" href="${lien(filtres, { etat: '', signale: false })}">Toutes<b>${total}</b></a>`,
    signales
      ? `<a class="puce alerte${filtres.signale ? ' actif' : ''}" href="${lien(filtres, { etat: '', signale: true })}">À corriger<b>${signales}</b></a>`
      : '',
    ...ETATS.filter(([cle]) => comptes[cle]).map(
      ([cle, lib]) => `<a class="puce${filtres.etat === cle ? ' actif' : ''}" href="${lien(filtres, { etat: cle, signale: false })}">${echapper(lib)}<b>${comptes[cle]}</b></a>`,
    ),
  ].join('');
  const choix = (nom, valeur, libelle) =>
    `<a class="${(filtres[nom] || (nom === 'tri' ? 'recent' : '')) === valeur ? 'actif' : ''}" href="${lien(filtres, { [nom]: valeur })}">${libelle}</a>`;
  const reglages = `<nav class="reglages" aria-label="Pays et tri">
${choix('pays', '', 'Tous pays')}${choix('pays', 'FR', 'France')}${choix('pays', 'US', 'États-Unis')}
<span class="sep"></span>${choix('tri', 'recent', 'Plus récentes')}${choix('tri', 'ancien', 'Plus anciennes')}${choix('tri', 'nom', 'Nom')}</nav>`;
  const cartes = vues
    .map(({ page, etat, aCorriger, retrait }) => {
      const lieu = [page.ville, PAYS[page.pays] || page.pays].filter(Boolean).join(' · ');
      return `<article class="carte"><a class="corps" href="/admin/p/${echapper(page.slug)}">${vignette(page)}
<div class="infos"><span class="nom">${echapper(page.nom || page.slug)}</span>
${lieu ? `<span class="lieu">${echapper(lieu)}</span>` : ''}
${badge(etat)}
${aCorriger ? `<span class="marque">${aCorriger} correction${aCorriger > 1 ? 's' : ''} demandée${aCorriger > 1 ? 's' : ''}</span>` : ''}
${retrait ? `<span class="marque">${retrait.action === 'retirer' ? 'Retrait demandé' : 'Remise en ligne demandée'}</span>` : ''}
</div></a>
<div class="pied"><span>${page.cree_le ? `Créée le ${dateCourte(page.cree_le)}` : ''}</span>${page.en_ligne ? `<a href="${echapper(page.url)}" target="_blank" rel="noopener">Voir la page</a>` : '<span>Hors ligne</span>'}</div></article>`;
    })
    .join('');
  return gabarit('Pages refaites', `${entete(instantane)}<main class="page">
<div class="compteurs">${puces}</div>${reglages}
${cartes ? `<div class="grille">${cartes}</div>` : `<p class="vide-liste">Aucune page pour ce filtre.</p>`}</main>`);
}

const FLASH = {
  etat: 'État enregistré.',
  note: 'Note enregistrée.',
  correction: 'Correction envoyée. Marco la reçoit à la prochaine synchronisation, dans le quart d’heure.',
  faite: 'Correction marquée faite.',
  retrait: 'Demande enregistrée. Elle s’applique à la prochaine synchronisation, dans le quart d’heure.',
  confirmer: 'Cochez la case de confirmation pour valider.',
  vide: 'Écrivez ce qui ne va pas avant d’envoyer.',
};

export function pageFiche({ page, manuel, message }) {
  const etat = etatEffectif(page, manuel);
  const lieu = [page.ville, PAYS[page.pays] || page.pays].filter(Boolean).join(' · ');
  const options = ETATS.map(
    ([cle, lib]) => `<option value="${cle}"${etat.force && etat.cle === cle ? ' selected' : ''}>${echapper(lib)}</option>`,
  ).join('');
  const origine = etat.force
    ? `Forcé à la main le ${dateHeure(etat.le)}. Le calcul automatique donnerait : ${echapper(LIBELLES[page.etat?.cle] || 'État à poser')}.`
    : `Calculé par Jarvis${etat.le ? `, depuis le ${dateHeure(etat.le)}` : ''}${etat.source ? ` (${echapper(etat.source)})` : ''}.`;

  const corrections = (manuel?.corrections || [])
    .slice()
    .reverse()
    .map((c) => {
      const statut = c.faite_le
        ? `Faite le ${dateHeure(c.faite_le)}`
        : c.transmise_le
          ? `Transmise à Marco le ${dateHeure(c.transmise_le)}`
          : 'En attente de transmission à Marco';
      return `<div class="correction"><p>${echapper(c.texte)}</p><div class="ligne"><span class="doux-texte">Demandée le ${dateHeure(c.demandee_le)} · ${statut}</span>
${c.faite_le ? '' : `<form method="post" action="/admin/p/${echapper(page.slug)}/correction/${echapper(c.id)}/faite"><button class="doux petit" type="submit">Marquer faite</button></form>`}</div></div>`;
    })
    .join('');

  const historique = [
    ...(page.historique || []).map((h) => ({ le: h.le, texte: h.texte })),
    ...(manuel?.journal || []).map((h) => ({
      le: h.le,
      texte: h.texte.replace(/^État forcé : (\w+)$/, (_, cle) => `État forcé : ${LIBELLES[cle] || cle}`),
    })),
  ].sort((a, b) => String(b.le).localeCompare(String(a.le)));

  const retrait = manuel?.retrait && !manuel.retrait.applique_le ? manuel.retrait : null;
  let blocRetrait;
  if (retrait) {
    blocRetrait = `<p>${retrait.action === 'retirer' ? 'Retrait' : 'Remise en ligne'} demandé${retrait.action === 'retirer' ? '' : 'e'} le ${dateHeure(retrait.demande_le)}. Jarvis l’applique à la prochaine synchronisation, dans le quart d’heure.</p>`;
  } else {
    const action = page.en_ligne ? 'retirer' : 'remettre';
    blocRetrait = `<form method="post" action="/admin/p/${echapper(page.slug)}/retrait"><input type="hidden" name="action" value="${action}">
<p class="doux-texte">${page.en_ligne ? 'La page est en ligne. La retirer la rend introuvable pour le prospect ; elle reste dans l’historique et se remet en ligne d’un geste.' : 'La page n’est plus en ligne. La remettre la rend de nouveau visible à la même adresse.'}</p>
<label class="case"><input type="checkbox" name="confirme" value="oui" required> ${page.en_ligne ? 'Je confirme le retrait de cette page' : 'Je confirme la remise en ligne'}</label>
<button class="${page.en_ligne ? 'danger' : ''}" type="submit">${page.en_ligne ? 'Retirer la page' : 'Remettre en ligne'}</button></form>`;
  }

  const corps = `<main class="page"><a class="retour" href="/admin">← Toutes les pages</a>
${message && FLASH[message] ? `<p class="flash" role="status">${FLASH[message]}</p>` : ''}
<div class="fiche" style="margin-top:16px">
<div class="col-image">
<h1>${echapper(page.nom || page.slug)}</h1>
<p class="doux-texte" style="margin:8px 0 16px">${echapper(lieu)}${page.cree_le ? ` · créée le ${dateCourte(page.cree_le)}` : ''}</p>
${vignette(page, 'image-grande')}
<div class="ligne">${page.en_ligne ? `<a class="bouton" href="${echapper(page.url)}" target="_blank" rel="noopener">Ouvrir la page</a>` : '<span class="doux-texte">Page hors ligne</span>'}</div>
</div>
<div>
<section class="bloc"><h2>État</h2><p>${badge(etat)}</p><p class="doux-texte">${origine}</p>
<form id="forcer" method="post" action="/admin/p/${echapper(page.slug)}/etat"><label for="etat">Forcer un autre état</label>
<select id="etat" name="etat" required>${etat.force ? '' : '<option value="" selected disabled>Choisir…</option>'}${options}</select></form>
<div class="ligne"><button form="forcer" type="submit">Enregistrer l’état</button>
${etat.force ? `<form method="post" action="/admin/p/${echapper(page.slug)}/etat"><input type="hidden" name="etat" value=""><button class="doux" type="submit">Revenir au calcul</button></form>` : ''}</div>
</section>
${page.emails?.length ? `<section class="bloc"><h2>Contact</h2><p class="mails">${page.emails.map(echapper).join('<br>')}</p></section>` : ''}
<section class="bloc"><h2>À corriger</h2>
<form method="post" action="/admin/p/${echapper(page.slug)}/correction"><label for="texte">Ce qui ne va pas sur cette page</label>
<textarea id="texte" name="texte" placeholder="Ex. : la photo du haut est floue, le numéro de téléphone est faux"></textarea>
<div class="ligne"><button type="submit">Envoyer à Marco</button></div></form>
${corrections ? `<div style="margin-top:16px">${corrections}</div>` : ''}</section>
<section class="bloc"><h2>Note</h2>
<form method="post" action="/admin/p/${echapper(page.slug)}/note"><label for="note">Note libre${manuel?.note?.le ? `, modifiée le ${dateHeure(manuel.note.le)}` : ''}</label>
<textarea id="note" name="note">${echapper(manuel?.note?.texte || '')}</textarea>
<div class="ligne"><button class="doux" type="submit">Enregistrer la note</button></div></form></section>
<section class="bloc"><h2>Historique</h2>${
    historique.length
      ? `<ul class="histo">${historique.map((h) => `<li><time>${dateHeure(h.le)}</time><span>${echapper(h.texte)}</span></li>`).join('')}</ul>`
      : '<p class="doux-texte">Rien de connu pour cette page.</p>'
  }</section>
<section class="bloc"><h2>${page.en_ligne ? 'Retirer la page' : 'Remettre en ligne'}</h2>${blocRetrait}</section>
</div></div></main>`;
  return gabarit(page.nom || page.slug, `${entete(null)}${corps}`);
}
