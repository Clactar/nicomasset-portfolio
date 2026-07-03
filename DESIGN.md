# Design — v2 « cinématique » (2026-07-03, après rejet de la v1 « trop cheap » par Nicolas)

## Visual Theme

Nuit d'encre bleutée, drama assumé : le site est une démonstration technique autant qu'une vitrine. UN accent cobalt électrique en deux registres : `#4d68ff` pour la lumière (halo, lueurs, liens, index outline) et `#2b41d6` pour les aplats porteurs de texte (section garantie, CTA pleins — contraste AA). Grain photographique fixe très léger. Aucun violet AI, aucun beige, thème sombre verrouillé sur toute la page.

## Color Palette

| Token | Valeur | Usage |
|---|---|---|
| `--bg` | `#08090d` | fond de page |
| `--bg-2` | `#0d0f16` | sections alternées (marquee, contact, footer) |
| `--surface` | `#12141d` | cartes |
| `--ink` | `#f2f4fa` | titres, texte fort |
| `--ink-soft` | `#b9bfce` | texte secondaire |
| `--muted` | `#8b93a8` | légendes (≥6:1 sur bg) |
| `--acc` | `#4d68ff` | halo, reflets, lueurs, strokes décoratifs |
| `--acc-deep` | `#2b41d6` | fonds porteurs de texte : pledge, boutons pleins (blanc 7.4:1) |
| `--acc-txt` | `#93a4ff` | texte accent sur fond nuit (8.5:1) |

## Typography

- **Display** : Clash Display (600/500) self-hosted ; **texte** : Satoshi (400/500/700 + italic).
- Hero h1 : clamp jusqu'à 6rem, révélation mot à mot (translateY 110% → 0, stagger 60ms).
- Chiffres géants (`.panel-idx`, `.step-n`) : outline `-webkit-text-stroke`, décoratifs `aria-hidden`.
- Email contact : outline qui se remplit au hover desktop ; PLEIN en permanence sur tactile (`hover:none`).

## Effets signature (tous gated `pointer:fine` + `prefers-reduced-motion`)

1. **Halo curseur** : 640px radial cobalt, `mix-blend-mode:screen`, suivi lerp 0.09 en rAF (jamais de listener scroll), z-index 30.
2. **Film hero** : 2 colonnes de captures inclinées 7°, défilement vertical infini en sens opposés (46s/58s), masque dégradé, pause hors écran via IO. Mobile : bande horizontale 230px SOUS le texte (`order:2`).
3. **Sticky stack réalisations** : 4 panneaux 100dvh `position:sticky;top:0` qui se recouvrent, fonds nuit différenciés, `+ .stack-tail` 46vh de respiration avant le recouvrement final. Mobile : panneaux statiques.
4. **Tilt 3D** : captures des panneaux, rotateX/Y max 8° pilotés par `--rx/--ry`, reflet radial `--mx/--my`, retour spring 0.5s.
5. **Cartes spotlight** (maquettes) : bord lumineux radial suivant le curseur (mask composite) + lueur interne.
6. **Boutons magnétiques** : translate 22-28 % vers le curseur, retour `cubic-bezier(.23,1,.32,1)`.
7. **CTA remplissage** : `clip-path inset` du haut vers le bas, 320ms.
8. **Manifeste scroll-driven** : mots du titre garantie qui s'allument (`animation-timeline: view()`, fallback `@supports` = opacité pleine), parallaxe légère des panneaux.
9. **Grain** : SVG feTurbulence sur calque fixe `pointer-events:none` (jamais sur conteneur scrollable).

## Layout

- Max 1280px. Hero plein viewport avec film en fond droit. Stack plein écran. Mocks 3 colonnes. Pledge full-bleed cobalt (1 seul color-block par page). About 7/5. Contact centré typographique géant.
- Mobile : tout en colonne, menu plein écran opaque, CTAs pleine largeur, effets curseur désactivés.

## Motion

- Courbes : `cubic-bezier(.16,1,.3,1)` (ease-out fort) partout, `.23,1,.32,1` pour les retours magnétiques/tilt.
- Durées UI ≤ 320ms ; défilements décoratifs 40-60s linéaires.
- `prefers-reduced-motion:reduce` : halo + grain `display:none`, film/marquee figés, contenu à opacité pleine, zéro translation.
