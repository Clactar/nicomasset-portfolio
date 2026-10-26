// Admin des pages refaites, servi sur nicomasset.com/admin (app Coolify à part,
// le site public reste statique). Aucune dépendance : node:http, node:crypto, node:fs.
//
// Deux fichiers de données dans DATA_DIR (volume persistant) :
//   pages.json  : l'instantané envoyé par Jarvis (liste, état calculé, historique)
//   manuel.json : ce que Nicolas fait ici (état forcé, note, corrections, retrait)
// Jarvis lit les gestes de Nicolas par /admin/api/actions et les acquitte par /admin/api/ack.

import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { estEtat } from './etats.mjs';
import { pageConnexion, pageListe, pageFiche, pageErreur } from './vues.mjs';

const SESSION_DUREE_S = 30 * 24 * 3600;
const COOKIE = 'nm_admin';
const ESSAIS_MAX = 10;
const ESSAIS_FENETRE_MS = 15 * 60 * 1000;
const VIGNETTE_MAX = 600 * 1024;
const SLUG = /^[a-z0-9][a-z0-9.-]{0,120}$/;

export function hacherMotDePasse(mdp, sel = crypto.randomBytes(16)) {
  const h = crypto.scryptSync(mdp, sel, 64);
  return `scrypt$${sel.toString('base64')}$${h.toString('base64')}`;
}

function verifierMotDePasse(mdp, empreinte) {
  const [algo, sel, h] = String(empreinte || '').split('$');
  if (algo !== 'scrypt' || !sel || !h) return false;
  const attendu = Buffer.from(h, 'base64');
  const calcule = crypto.scryptSync(String(mdp), Buffer.from(sel, 'base64'), attendu.length);
  return crypto.timingSafeEqual(attendu, calcule);
}

function egalSur(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

function lireJson(fichier, defaut) {
  try {
    return JSON.parse(fs.readFileSync(fichier, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return defaut;
    throw e;
  }
}

function ecrireJson(fichier, valeur) {
  const tmp = `${fichier}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(valeur, null, 1));
  fs.renameSync(tmp, fichier);
}

function lireCorps(req, max = 2 * 1024 * 1024) {
  return new Promise((ok, ko) => {
    const morceaux = [];
    let taille = 0;
    req.on('data', (m) => {
      taille += m.length;
      if (taille > max) {
        ko(Object.assign(new Error('corps trop gros'), { statut: 413 }));
        req.destroy();
      } else morceaux.push(m);
    });
    req.on('end', () => ok(Buffer.concat(morceaux)));
    req.on('error', ko);
  });
}

function formulaire(buf) {
  return Object.fromEntries(new URLSearchParams(buf.toString('utf8')));
}

function cookies(req) {
  const sortie = {};
  for (const morceau of (req.headers.cookie || '').split(';')) {
    const i = morceau.indexOf('=');
    if (i > 0) sortie[morceau.slice(0, i).trim()] = morceau.slice(i + 1).trim();
  }
  return sortie;
}

function ipDe(req) {
  return (
    req.headers['cf-connecting-ip'] ||
    String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket.remoteAddress ||
    '?'
  );
}

export function creerServeur(config) {
  const { utilisateur, empreinteMdp, secretSession, jetonSync, dossier } = config;
  if (!empreinteMdp || !secretSession || secretSession.length < 32 || !jetonSync || jetonSync.length < 32) {
    throw new Error('configuration incomplète : ADMIN_PASSWORD_HASH, SESSION_SECRET et SYNC_TOKEN (32 caractères min.) sont obligatoires');
  }
  const maintenant = config.maintenant || (() => new Date());
  const fichierPages = path.join(dossier, 'pages.json');
  const fichierManuel = path.join(dossier, 'manuel.json');
  const dossierVignettes = path.join(dossier, 'vignettes');
  fs.mkdirSync(dossierVignettes, { recursive: true });

  let instantane = lireJson(fichierPages, { genere_le: null, pages: [] });
  let manuel = lireJson(fichierManuel, {});
  const essais = new Map();

  const signer = (exp) => crypto.createHmac('sha256', secretSession).update(`session:${exp}`).digest('base64url');
  const jetonSession = () => {
    const exp = Math.floor(maintenant().getTime() / 1000) + SESSION_DUREE_S;
    return `${exp}.${signer(exp)}`;
  };
  const sessionValide = (req) => {
    const v = cookies(req)[COOKIE];
    if (!v) return false;
    const [exp, sig] = v.split('.');
    if (!exp || !sig || !/^\d+$/.test(exp)) return false;
    if (Number(exp) * 1000 < maintenant().getTime()) return false;
    return egalSur(sig, signer(exp));
  };
  const jetonValide = (req) => {
    const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
    return Boolean(m) && egalSur(m[1], jetonSync);
  };

  const fiche = (slug) => {
    if (!manuel[slug]) manuel[slug] = { corrections: [], journal: [] };
    manuel[slug].corrections ||= [];
    manuel[slug].journal ||= [];
    return manuel[slug];
  };
  const noter = (slug, texte) => fiche(slug).journal.push({ le: maintenant().toISOString(), texte });
  const sauverManuel = () => ecrireJson(fichierManuel, manuel);
  const pageDe = (slug) => instantane.pages.find((p) => p.slug === slug);

  const entetes = {
    'x-robots-tag': 'noindex, nofollow',
    'cache-control': 'no-store',
    'referrer-policy': 'same-origin',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'content-security-policy':
      "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  };
  const envoyer = (res, statut, corps, type = 'text/html; charset=utf-8', plus = {}) => {
    res.writeHead(statut, { ...entetes, 'content-type': type, ...plus });
    res.end(corps);
  };
  const html = (res, statut, corps, plus) => envoyer(res, statut, corps, 'text/html; charset=utf-8', plus);
  const json = (res, statut, objet) => envoyer(res, statut, JSON.stringify(objet), 'application/json; charset=utf-8');
  const rediriger = (res, ou, plus = {}) => {
    res.writeHead(303, { ...entetes, location: ou, ...plus });
    res.end();
  };
  const cookieSession = (valeur, age) =>
    `${COOKIE}=${valeur}; Path=/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;

  async function routeur(req, res) {
    const url = new URL(req.url, 'http://x');
    const p = url.pathname.replace(/\/+$/, '') || '/';
    const m = req.method;

    if (p === '/admin/sante') return envoyer(res, 200, 'ok', 'text/plain; charset=utf-8');
    if (!p.startsWith('/admin')) return html(res, 404, pageErreur('Page introuvable.'));

    // Formulaires : le cookie est SameSite=Strict, et on refuse une origine étrangère.
    if (m === 'POST' && req.headers.origin) {
      let hote = '';
      try { hote = new URL(req.headers.origin).host; } catch { /* origine illisible */ }
      if (hote !== req.headers.host) return html(res, 403, pageErreur('Origine refusée.'));
    }

    // API de synchronisation (Jarvis), jeton porteur.
    if (p.startsWith('/admin/api/')) {
      if (!jetonValide(req)) return json(res, 401, { erreur: 'jeton manquant ou faux' });
      if (p === '/admin/api/pages' && m === 'PUT') {
        const corps = JSON.parse((await lireCorps(req)).toString('utf8'));
        if (!Array.isArray(corps.pages) || corps.pages.some((x) => !SLUG.test(x.slug || ''))) {
          return json(res, 400, { erreur: 'pages invalides' });
        }
        instantane = { genere_le: corps.genere_le || maintenant().toISOString(), pages: corps.pages };
        ecrireJson(fichierPages, instantane);
        return json(res, 200, { ok: true, pages: corps.pages.length });
      }
      const mv = /^\/admin\/api\/vignette\/([^/]+)$/.exec(p);
      if (mv && m === 'PUT') {
        if (!SLUG.test(mv[1])) return json(res, 400, { erreur: 'slug invalide' });
        const img = await lireCorps(req, VIGNETTE_MAX);
        if (img.subarray(8, 12).toString('latin1') !== 'WEBP') return json(res, 400, { erreur: 'webp attendu' });
        fs.writeFileSync(path.join(dossierVignettes, `${mv[1]}.webp`), img);
        return json(res, 200, { ok: true });
      }
      if (p === '/admin/api/actions' && m === 'GET') {
        const corrections = [];
        const retraits = [];
        const etats_forces = {};
        for (const [slug, f] of Object.entries(manuel)) {
          for (const c of f.corrections || []) if (!c.transmise_le) corrections.push({ slug, ...c });
          if (f.retrait && !f.retrait.applique_le) retraits.push({ slug, ...f.retrait });
          if (f.etat_force) etats_forces[slug] = f.etat_force;
        }
        const vignettes = fs.readdirSync(dossierVignettes).filter((f) => f.endsWith('.webp')).map((f) => f.slice(0, -5));
        return json(res, 200, { corrections, retraits, etats_forces, vignettes });
      }
      if (p === '/admin/api/ack' && m === 'POST') {
        const corps = JSON.parse((await lireCorps(req)).toString('utf8'));
        const le = maintenant().toISOString();
        let n = 0;
        for (const f of Object.values(manuel)) {
          for (const c of f.corrections || []) {
            if ((corps.corrections_transmises || []).includes(c.id) && !c.transmise_le) { c.transmise_le = le; n++; }
            if ((corps.corrections_faites || []).includes(c.id) && !c.faite_le) { c.faite_le = le; n++; }
          }
        }
        for (const r of corps.retraits_appliques || []) {
          const f = manuel[r.slug];
          if (f?.retrait && !f.retrait.applique_le && f.retrait.action === r.action) {
            f.retrait.applique_le = le;
            noter(r.slug, r.action === 'retirer' ? 'Page retirée du site' : 'Page remise en ligne');
            n++;
          }
        }
        sauverManuel();
        return json(res, 200, { ok: true, acquittes: n });
      }
      return json(res, 404, { erreur: 'route inconnue' });
    }

    if (p === '/admin/connexion') {
      if (m === 'GET') return html(res, 200, pageConnexion({}));
      if (m === 'POST') {
        const ip = ipDe(req);
        const t = maintenant().getTime();
        const recents = (essais.get(ip) || []).filter((x) => t - x < ESSAIS_FENETRE_MS);
        if (recents.length >= ESSAIS_MAX) {
          return html(res, 429, pageConnexion({ erreur: 'Trop d’essais. Réessayez dans un quart d’heure.' }));
        }
        const f = formulaire(await lireCorps(req, 4096));
        // Les deux vérifications tournent toujours, pour ne pas dire laquelle a échoué par le temps de réponse.
        const okIdentifiant = egalSur(f.identifiant || '', utilisateur);
        const okMotDePasse = verifierMotDePasse(f.mot_de_passe || '', empreinteMdp);
        if (okIdentifiant && okMotDePasse) {
          essais.delete(ip);
          return rediriger(res, '/admin', { 'set-cookie': cookieSession(jetonSession(), SESSION_DUREE_S) });
        }
        essais.set(ip, [...recents, t]);
        return html(res, 401, pageConnexion({ erreur: 'Identifiant ou mot de passe incorrect.' }));
      }
    }
    if (p === '/admin/deconnexion' && m === 'POST') {
      return rediriger(res, '/admin/connexion', { 'set-cookie': cookieSession('', 0) });
    }

    // Tout le reste exige la connexion.
    if (!sessionValide(req)) {
      if (m === 'GET') return rediriger(res, '/admin/connexion');
      return html(res, 401, pageErreur('Connexion requise.'));
    }

    if (p === '/admin' && m === 'GET') {
      return html(res, 200, pageListe({
        instantane,
        manuel,
        filtres: {
          etat: url.searchParams.get('etat') || '',
          pays: url.searchParams.get('pays') || '',
          tri: url.searchParams.get('tri') || 'recent',
          signale: url.searchParams.get('signale') === '1',
        },
        maintenant: maintenant(),
      }));
    }

    const mvig = /^\/admin\/vignette\/([^/]+)$/.exec(p);
    if (mvig && m === 'GET') {
      const fichier = path.join(dossierVignettes, `${mvig[1]}.webp`);
      if (!SLUG.test(mvig[1]) || !fs.existsSync(fichier)) return envoyer(res, 404, '', 'text/plain');
      return envoyer(res, 200, fs.readFileSync(fichier), 'image/webp', { 'cache-control': 'private, max-age=3600' });
    }

    const mp = /^\/admin\/p\/([^/]+)(\/.*)?$/.exec(p);
    if (mp && SLUG.test(mp[1])) {
      const slug = mp[1];
      const page = pageDe(slug);
      if (!page) return html(res, 404, pageErreur('Cette page n’est pas dans la liste.'));
      const action = mp[2] || '';
      if (m === 'GET' && !action) {
        return html(res, 200, pageFiche({ page, manuel: manuel[slug], message: url.searchParams.get('ok') || '' }));
      }
      if (m !== 'POST') return html(res, 405, pageErreur('Méthode refusée.'));
      const f = formulaire(await lireCorps(req, 64 * 1024));
      const retour = (ok) => rediriger(res, `/admin/p/${slug}?ok=${ok}`);
      const le = maintenant().toISOString();

      if (action === '/etat') {
        if (f.etat === '') {
          fiche(slug).etat_force = null;
          noter(slug, 'État rendu au calcul automatique');
        } else if (estEtat(f.etat)) {
          fiche(slug).etat_force = { etat: f.etat, le };
          noter(slug, `État forcé : ${f.etat}`);
        } else return html(res, 400, pageErreur('État inconnu.'));
        sauverManuel();
        return retour('etat');
      }
      if (action === '/note') {
        fiche(slug).note = { texte: String(f.note || '').slice(0, 5000), le };
        noter(slug, 'Note modifiée');
        sauverManuel();
        return retour('note');
      }
      if (action === '/correction') {
        const texte = String(f.texte || '').trim().slice(0, 5000);
        if (!texte) return retour('vide');
        const id = `c-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
        fiche(slug).corrections.push({ id, texte, demandee_le: le, transmise_le: null, faite_le: null });
        noter(slug, `Correction demandée : ${texte.slice(0, 140)}`);
        sauverManuel();
        return retour('correction');
      }
      const mc = /^\/correction\/([a-z0-9-]+)\/faite$/.exec(action);
      if (mc) {
        const c = fiche(slug).corrections.find((x) => x.id === mc[1]);
        if (c && !c.faite_le) {
          c.faite_le = le;
          noter(slug, 'Correction marquée faite');
          sauverManuel();
        }
        return retour('faite');
      }
      if (action === '/retrait') {
        if (!['retirer', 'remettre'].includes(f.action)) return html(res, 400, pageErreur('Action inconnue.'));
        if (f.confirme !== 'oui') return retour('confirmer');
        fiche(slug).retrait = { action: f.action, demande_le: le, applique_le: null };
        noter(slug, f.action === 'retirer' ? 'Retrait demandé' : 'Remise en ligne demandée');
        sauverManuel();
        return retour('retrait');
      }
      return html(res, 404, pageErreur('Action inconnue.'));
    }

    return html(res, 404, pageErreur('Page introuvable.'));
  }

  return http.createServer((req, res) => {
    routeur(req, res).catch((e) => {
      if (res.headersSent) return res.destroy();
      const statut = e.statut || (e instanceof SyntaxError ? 400 : 500);
      if (statut === 500) console.error(e);
      envoyer(res, statut, statut === 500 ? 'Erreur interne' : e.message, 'text/plain; charset=utf-8');
    });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv[2] === 'hacher') {
    // Usage : printf '%s' "$MDP" | node server.mjs hacher
    const mdp = fs.readFileSync(0, 'utf8');
    process.stdout.write(hacherMotDePasse(mdp) + '\n');
  } else {
    const serveur = creerServeur({
      utilisateur: process.env.ADMIN_USER || 'nicolas',
      empreinteMdp: process.env.ADMIN_PASSWORD_HASH,
      secretSession: process.env.SESSION_SECRET,
      jetonSync: process.env.SYNC_TOKEN,
      dossier: process.env.DATA_DIR || '/data',
    });
    const port = Number(process.env.PORT || 3000);
    serveur.listen(port, () => console.log(`admin des pages refaites sur :${port}`));
  }
}
