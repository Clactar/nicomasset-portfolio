# Design

## Visual Theme

Lumière et encre : fond neutre froid très clair (`#f4f5f7`), texte encre profonde (`#101116`), UN accent cobalt saturé (`#2740e0`) qui porte 30-60 % de la section « garantie » (stratégie « committed » : le cobalt EST l'identité). Aucun beige/crème, aucun violet AI, aucun dégradé décoratif.

## Color Palette

| Token | Valeur | Usage |
|---|---|---|
| `--bg` | `#f4f5f7` | fond de page |
| `--surface` | `#ffffff` | cartes |
| `--ink` | `#101116` | titres, texte fort, boutons solides |
| `--ink-soft` | `#3c3f4c` | texte secondaire |
| `--muted` | `#565a6b` | légendes (AA sur bg) |
| `--cobalt` | `#2740e0` | accent unique : CTA hover, badges « En ligne », section garantie |
| `--line` | `rgba(16,17,22,.13)` | hairlines |

Règle : un seul accent sur toute la page. Le cobalt n'est jamais concurrencé.

## Typography

- **Display / titres** : Clash Display (600, 500) — self-hosted woff2, letter-spacing négatif léger (max −0.025em).
- **Texte** : Satoshi (400/500/700 + italic) — self-hosted woff2.
- `text-wrap: balance` sur les titres, `pretty` sur la prose. Corps ≤ 65ch.
- Emphase dans un titre : italique de la MÊME famille (jamais une serif injectée).

## Components

- **Boutons** : pill (radius 999), solide encre → hover cobalt + levée 2px ; ligne 1.5px ; `:active scale(.98)`.
- **Cartes projet** : radius 18px, hairline, capture 16/10 en tête, meta dessous, badge pill (« En ligne » cobalt plein / « Maquette » outline).
- **Pile hero** : 3 vraies captures superposées avec rotations ±2.5°, chrome navigateur minimal sur la principale.
- **Étapes** : 3 colonnes, gros numéro Clash, hairline top — vraie séquence, donc numérotation légitime.

## Layout

- Grille 12 colonnes, max 1240px, gouttières clamp.
- Rythme : sections clamp(76-128px) ; la section cobalt casse le fond clair une seule fois (color-block story, 1 par page max).
- Bento réalisations : 7/5 puis 5/7 puis 4/4/4 — jamais deux rangées identiques.
- Mobile : tout retombe en 1 colonne, menu plein écran, CTAs pleine largeur.

## Motion

- Entrées hero : rise 22px + fade, cascade 50-130ms, courbe `cubic-bezier(.16,1,.3,1)` (ease-out fort).
- Reveal au scroll : IntersectionObserver uniquement (jamais de listener scroll), `once`, filet de sécurité 1,6 s.
- Hover cartes : levée 6px + zoom image 1.04 en 450-900ms ease-out.
- Marquee métiers : 40 s linéaire, pause au hover, UNE seule sur la page.
- `prefers-reduced-motion` : tout devient statique (marquee comprise).
