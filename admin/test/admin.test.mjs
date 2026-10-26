// Ce que l'admin garantit, joué contre un vrai serveur sur un port libre.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { creerServeur, hacherMotDePasse } from '../server.mjs';

const MDP = 'correct horse battery staple';
const JETON = 'j'.repeat(40);
const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'admin-apercus-'));
let base;
let serveur;

const PAGES = [
  {
    slug: 'yogagana', nom: "YoGa'gana", ville: "L'Isle-d'Abeau", pays: 'FR', cree_le: '2026-09-09',
    url: 'https://nicomasset.com/apercus/yogagana.html', en_ligne: true, emails: ['secret-prospect@exemple.fr'],
    etat: { cle: 'interesse', le: '2026-09-18', source: 'replies.csv' },
    historique: [{ le: '2026-09-09T19:50:00Z', texte: 'Mail parti : Votre page' }],
  },
  {
    slug: 'bandana-pottery-nc', nom: 'Bandana Pottery', ville: 'NC', pays: 'US', cree_le: '2026-10-26',
    url: 'https://nicomasset.com/apercus/bandana-pottery-nc.html', en_ligne: true, emails: [],
    etat: { cle: 'non_presentee' }, historique: [],
  },
];

async function appel(chemin, { methode = 'GET', corps, cookie, jeton, origine, type } = {}) {
  const entetes = {};
  if (cookie) entetes.cookie = cookie;
  if (jeton) entetes.authorization = `Bearer ${jeton}`;
  if (origine) entetes.origin = origine;
  if (corps !== undefined) entetes['content-type'] = type || 'application/x-www-form-urlencoded';
  const r = await fetch(base + chemin, { method: methode, headers: entetes, body: corps, redirect: 'manual' });
  return { statut: r.status, texte: await r.text(), entetes: r.headers };
}

before(async () => {
  serveur = creerServeur({ utilisateur: 'nicolas', empreinteMdp: hacherMotDePasse(MDP), secretSession: 's'.repeat(40), jetonSync: JETON, dossier });
  await new Promise((ok) => serveur.listen(0, '127.0.0.1', ok));
  base = `http://127.0.0.1:${serveur.address().port}`;
  const r = await appel('/admin/api/pages', { methode: 'PUT', jeton: JETON, type: 'application/json', corps: JSON.stringify({ genere_le: '2026-10-26T08:00:00Z', pages: PAGES }) });
  assert.equal(r.statut, 200);
});
after(() => serveur.close());

test('refuse de démarrer sans secrets', () => {
  assert.throws(() => creerServeur({ utilisateur: 'n', empreinteMdp: '', secretSession: '', jetonSync: '', dossier }));
});

test('sans connexion : la liste renvoie vers la connexion et ne montre aucune donnée', async () => {
  const r = await appel('/admin');
  assert.equal(r.statut, 303);
  assert.equal(r.entetes.get('location'), '/admin/connexion');
  assert.doesNotMatch(r.texte, /secret-prospect/);
  const fiche = await appel('/admin/p/yogagana');
  assert.equal(fiche.statut, 303);
  const post = await appel('/admin/p/yogagana/etat', { methode: 'POST', corps: 'etat=gardee' });
  assert.equal(post.statut, 401);
  const vig = await appel('/admin/vignette/yogagana');
  assert.equal(vig.statut, 303);
});

test('un cookie forgé ou expiré est refusé', async () => {
  const r = await appel('/admin', { cookie: 'nm_admin=9999999999.faux' });
  assert.equal(r.statut, 303);
});

test('mauvais mot de passe : refus, et blocage après dix essais', async () => {
  for (let i = 0; i < 10; i++) {
    const r = await appel('/admin/connexion', { methode: 'POST', corps: 'identifiant=nicolas&mot_de_passe=non' });
    assert.equal(r.statut, 401);
  }
  const bloque = await appel('/admin/connexion', { methode: 'POST', corps: new URLSearchParams({ identifiant: 'nicolas', mot_de_passe: MDP }).toString() });
  assert.equal(bloque.statut, 429);
});

test('API sans jeton ou avec un faux jeton : 401', async () => {
  assert.equal((await appel('/admin/api/actions')).statut, 401);
  assert.equal((await appel('/admin/api/actions', { jeton: 'faux' })).statut, 401);
});

test('connecté : la liste montre les pages, les compteurs et les en-têtes noindex', async (t) => {
  // le blocage du test précédent porte sur 127.0.0.1 : une autre adresse se connecte
  const cookie = await connecterDepuis('10.0.0.2');
  const r = await appel('/admin', { cookie });
  assert.equal(r.statut, 200);
  assert.match(r.texte, /YoGa&#39;gana/);
  assert.match(r.texte, /Bandana Pottery/);
  assert.match(r.texte, /A répondu : intéressé<b>1<\/b>/);
  assert.equal(r.entetes.get('x-robots-tag'), 'noindex, nofollow');
  assert.equal(r.entetes.get('cache-control'), 'no-store');
  const us = await appel('/admin?pays=US', { cookie });
  assert.doesNotMatch(us.texte, /YoGa/);
  t.diagnostic('liste OK');
});

async function connecterDepuis(ip) {
  const r = await fetch(`${base}/admin/connexion`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'cf-connecting-ip': ip },
    body: new URLSearchParams({ identifiant: 'nicolas', mot_de_passe: MDP }).toString(),
    redirect: 'manual',
  });
  assert.equal(r.status, 303);
  const c = r.headers.get('set-cookie');
  assert.match(c, /HttpOnly/);
  assert.match(c, /SameSite=Strict/);
  assert.match(c, /Path=\/admin/);
  return c.split(';')[0];
}

test('forcer un état, puis revenir au calcul', async () => {
  const cookie = await connecterDepuis('10.0.0.3');
  let r = await appel('/admin/p/yogagana/etat', { methode: 'POST', cookie, corps: 'etat=modification' });
  assert.equal(r.statut, 303);
  r = await appel('/admin/p/yogagana', { cookie });
  assert.match(r.texte, /En modification avec le client · forcé/);
  const actions = JSON.parse((await appel('/admin/api/actions', { jeton: JETON })).texte);
  assert.equal(actions.etats_forces.yogagana.etat, 'modification');
  await appel('/admin/p/yogagana/etat', { methode: 'POST', cookie, corps: 'etat=' });
  r = await appel('/admin/p/yogagana', { cookie });
  assert.match(r.texte, /A répondu : intéressé<\/span>/);
  assert.equal((await appel('/admin/p/yogagana/etat', { methode: 'POST', cookie, corps: 'etat=nimporte' })).statut, 400);
});

test('une correction part chez Marco par l’API, puis se marque transmise et faite', async () => {
  const cookie = await connecterDepuis('10.0.0.4');
  await appel('/admin/p/bandana-pottery-nc/correction', { methode: 'POST', cookie, corps: 'texte=Le+titre+est+coupé' });
  let actions = JSON.parse((await appel('/admin/api/actions', { jeton: JETON })).texte);
  const c = actions.corrections.find((x) => x.slug === 'bandana-pottery-nc');
  assert.equal(c.texte, 'Le titre est coupé');
  const liste = await appel('/admin?signale=1', { cookie });
  assert.match(liste.texte, /Bandana Pottery/);
  assert.doesNotMatch(liste.texte, /YoGa/);
  await appel('/admin/api/ack', { methode: 'POST', jeton: JETON, type: 'application/json', corps: JSON.stringify({ corrections_transmises: [c.id] }) });
  actions = JSON.parse((await appel('/admin/api/actions', { jeton: JETON })).texte);
  assert.equal(actions.corrections.length, 0);
  let fiche = await appel('/admin/p/bandana-pottery-nc', { cookie });
  assert.match(fiche.texte, /Transmise à Marco le/);
  await appel(`/admin/p/bandana-pottery-nc/correction/${c.id}/faite`, { methode: 'POST', cookie, corps: '' });
  fiche = await appel('/admin/p/bandana-pottery-nc', { cookie });
  assert.match(fiche.texte, /Faite le/);
});

test('note libre et historique', async () => {
  const cookie = await connecterDepuis('10.0.0.5');
  await appel('/admin/p/yogagana/note', { methode: 'POST', cookie, corps: 'note=Rappeler+<b>lundi</b>' });
  const r = await appel('/admin/p/yogagana', { cookie });
  assert.match(r.texte, /Rappeler &lt;b&gt;lundi&lt;\/b&gt;/);
  assert.match(r.texte, /Note modifiée/);
  assert.match(r.texte, /Mail parti : Votre page/);
  // Cloudflare brouille les adresses sauf entre ces balises (son script est bloqué par la CSP)
  assert.match(r.texte, /<!--email_off-->secret-prospect@exemple\.fr<!--\/email_off-->/);
});

test('retrait : exige la case, puis passe par l’API et s’acquitte', async () => {
  const cookie = await connecterDepuis('10.0.0.6');
  let r = await appel('/admin/p/bandana-pottery-nc/retrait', { methode: 'POST', cookie, corps: 'action=retirer' });
  assert.match(r.entetes.get('location'), /ok=confirmer/);
  let actions = JSON.parse((await appel('/admin/api/actions', { jeton: JETON })).texte);
  assert.equal(actions.retraits.length, 0);
  await appel('/admin/p/bandana-pottery-nc/retrait', { methode: 'POST', cookie, corps: 'action=retirer&confirme=oui' });
  actions = JSON.parse((await appel('/admin/api/actions', { jeton: JETON })).texte);
  assert.deepEqual(actions.retraits.map((x) => [x.slug, x.action]), [['bandana-pottery-nc', 'retirer']]);
  await appel('/admin/api/ack', { methode: 'POST', jeton: JETON, type: 'application/json', corps: JSON.stringify({ retraits_appliques: [{ slug: 'bandana-pottery-nc', action: 'retirer' }] }) });
  actions = JSON.parse((await appel('/admin/api/actions', { jeton: JETON })).texte);
  assert.equal(actions.retraits.length, 0);
  r = await appel('/admin/p/bandana-pottery-nc', { cookie });
  assert.match(r.texte, /Page retirée du site/);
});

test('un formulaire posté depuis un autre site est refusé', async () => {
  const cookie = await connecterDepuis('10.0.0.7');
  const r = await appel('/admin/p/yogagana/etat', { methode: 'POST', cookie, corps: 'etat=gardee', origine: 'https://pirate.example' });
  assert.equal(r.statut, 403);
});

test('les données survivent à un redémarrage', async () => {
  const autre = creerServeur({ utilisateur: 'nicolas', empreinteMdp: hacherMotDePasse(MDP), secretSession: 's'.repeat(40), jetonSync: JETON, dossier });
  await new Promise((ok) => autre.listen(0, '127.0.0.1', ok));
  const r = await fetch(`http://127.0.0.1:${autre.address().port}/admin/api/actions`, { headers: { authorization: `Bearer ${JETON}` } });
  const corps = await r.json();
  autre.close();
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(corps.corrections));
  assert.ok(fs.existsSync(path.join(dossier, 'manuel.json')));
});

test('vignette : seul un WebP est accepté, et seulement avec le jeton', async () => {
  const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 '), Buffer.alloc(16)]);
  assert.equal((await appel('/admin/api/vignette/yogagana', { methode: 'PUT', corps: webp, type: 'image/webp' })).statut, 401);
  assert.equal((await appel('/admin/api/vignette/yogagana', { methode: 'PUT', jeton: JETON, corps: Buffer.from('<svg>'), type: 'image/webp' })).statut, 400);
  assert.equal((await appel('/admin/api/vignette/yogagana', { methode: 'PUT', jeton: JETON, corps: webp, type: 'image/webp' })).statut, 200);
  const cookie = await connecterDepuis('10.0.0.8');
  const r = await fetch(`${base}/admin/vignette/yogagana`, { headers: { cookie } });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'image/webp');
});
