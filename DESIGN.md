> En ligne depuis le 2026-09-24 (feu vert de Nicolas). Fichiers de la page : `index.html` et `accueil/` (style, script, polices, images). Les annotations de l'avant/après sont des flèches au feutre et des notes manuscrites (retour de Nicolas du 24/09 10h11), plus des surligneurs. Accord écrit d'Adeline pour l'avant/après reçu le 24/09 à 11h16. Les autres pages (mentions légales, aperçus clients) gardent l'ancien style `styles.css`.

# nicomasset.com, refonte du 24/09 : direction visuelle

Nova, 2026-09-24. Cadre : `business/agence-web/refonte-nicomasset-2026-09-24/00-spec.md` et `business/agence-web/charte-design.md`. Ce fichier se relit en revue, pas le goût du jour.

## Sujet, lecteur, travail de la page

- **Sujet** : un homme qui reprend la page d'accueil d'un indépendant et ne se fait payer que si elle est gardée.
- **Lecteur** : une coiffeuse, un photographe, un gîteur qui a fait son Wix lui-même, qui vient de lire un mail lui disant que son site lui fait perdre des clientes, et qui tape l'adresse sur son téléphone.
- **Travail** : en dix secondes, lui faire lire l'offre (je refais, vous payez si vous gardez, 390 €), lui montrer qu'il sait le faire, et lui donner un seul geste pour répondre.

## Direction : « l'épreuve corrigée »

Le monde de l'offre, c'est la relecture : on prend la page telle qu'elle est, on marque ce qui fait perdre une cliente, on rend la page propre. Le mail que le prospect vient de lire fait déjà exactement ça (deux défauts, chacun traduit en cliente perdue). Le site reprend ce geste en image, sur un cas réel : **le Wix d'Adeline annoté au surligneur, puis sa page adelinej.fr**, dans un cadre de téléphone qu'on fait glisser de l'un à l'autre. C'est la seule audace de la page. Tout le reste est calme, typographique, lisible au pouce.

Pourquoi ce choix et pas un autre : l'effet waouh demandé doit venir de la transformation (arbitrage 3). Un défilé de captures en fond (le site actuel) montre des sites finis sans montrer ce qui a changé. Le surligneur montre le changement et parle la langue du mail.

## Jetons verrouillés

### Couleurs (3 teintes, 60/30/10, plus leurs dérivés de clarté)

| Nom | Valeur | Rôle |
|---|---|---|
| Papier | `#EEF0EB` | fond dominant (60) : un blanc cassé froid, légèrement vert, pas le crème chaud |
| Papier clair | `#F8F9F6` | surfaces posées sur le papier (écart de clarté, pas de bordure) |
| Encre | `#18221D` | texte, boutons, blocs pleins (30) : noir vert, jamais `#000` |
| Encre douce | `#4E5A53` | texte secondaire (Lc mesuré en contrôle) |
| Surligneur | `#F2DF4A` | accent (10) : uniquement ce qui est MARQUÉ (les défauts annotés, le prix). 3 usages maximum par écran |
| Filet | `#D5DAD2` | séparations rares, une par liste au plus |

Aucun dégradé, aucun halo, aucun mode sombre. Un seul bloc en encre pleine sur la page : le prix.

### Typographie (deux familles nettement distinctes)

- **Familjen Grotesk** 500 et 600 : titres, prix, boutons, libellés. Grotesque aux formes un peu irrégulières (le g, le a), qui n'est pas dans la liste noire et ne ressemble pas au site actuel.
- **Newsreader** (axe optique) 400, 500 et italique 400 : texte courant et annotations. Serif de lecture : le texte se lit comme une lettre, pas comme une fiche produit. Les annotations sont en italique, comme une note en marge.
- Échelle (rapport 1,25 sur une base 18 px au téléphone, 19 px au bureau) : 14 / 16 / 18 / 22 / 28 / 35 / 44 / 56 / 72. Titres en 500 ou 600, jamais 700. Interlignage texte 1,55, titres 1,05 à 1,15. `text-wrap: balance` sur les titres, `pretty` sur les paragraphes. Lignes de 60 à 72 caractères.
- Pas de majuscules espacées, pas de mot isolé en couleur dans un titre, pas de sur-titre au-dessus des titres.

### Espacement, rayons, ombres

- Grille de 8 : 8, 16, 24, 32, 48, 64, 96, 128. Intra < inter-composant < inter-section (96 au téléphone, 128 au bureau).
- Rayons : 999 px pour les boutons (pilule, un seul objet cliquable reconnaissable), 28 px pour le cadre de téléphone, 6 px pour les captures posées. Pas un rayon unique partout.
- Une seule ombre, portée par le cadre de téléphone (c'est un objet posé sur la table). Rien d'autre n'a d'ombre.

## Mise en page

Téléphone d'abord (390), une colonne, tout aligné à gauche. Bureau (1440) : grille de 12 colonnes, largeur utile 1200.

```
TÉLÉPHONE 390                         BUREAU 1440
┌──────────────────────┐              ┌────────────────────────────────────────────┐
│ Nicolas Masset [M'écrire]│ collant   │ Nicolas Masset        Réalisations Prix [M'écrire]│
│                      │              │                                            │
│ Titre : je refais    │              │ Titre (7 col)             ┌──────┐         │
│ votre page d'accueil,│              │ offre en 2 phrases        │ tél. │ avant/  │
│ vous payez si vous   │              │ 390 €, si gardée          │ Adel.│ après   │
│ la gardez.           │              │ [M'écrire] appel          └──────┘ (5 col) │
│ 390 €, si gardée     │              ├────────────────────────────────────────────┤
│ [M'écrire à Nicolas] │              │ 3 temps sur une ligne (vraie séquence)     │
├──────────────────────┤              ├────────────────────────────────────────────┤
│ ┌────┐ Adeline :     │              │ PRIX : bloc encre pleine, 390 € géant       │
│ │tél.│ avant/après   │              │ 790 € et 29 €/mois en dessous, plus calmes │
│ └────┘ + annotations │              ├────────────────────────────────────────────┤
│ 3 temps (1, 2, 3)    │              │ Réalisations : Noémie grande, puis liste    │
│ PRIX (bloc encre)    │              │ Qui je suis / Questions / Dernier appel    │
│ Réalisations …       │              └────────────────────────────────────────────┘
└──────────────────────┘
```

- **Premier écran téléphone** : en-tête collant, titre, une phrase, le prix et sa condition, le bouton. Pas d'image : le texte fait le travail du critère 2, l'image arrive au deuxième écran.
- **Le cadre de téléphone** : curseur « Avant / Après » (un `input type=range` réel, clavier et pouce), l'adresse du site affichée au-dessus de l'écran (c'est le premier défaut du mail), les annotations surlignées posées sur l'avant. Étiquette fixe sur le cadre : « Accord d'Adeline à demander ».
- **Numérotation** : seulement pour les trois temps, parce que c'est une vraie séquence. Nulle part ailleurs.
- **Réalisations** : pas trois cartes. Une liste éditoriale : capture à gauche, métier et ce qui a changé à droite, étiquette « En ligne » ou « Maquette », lien vers le site.
- **Questions** : `details` natifs, ouverture animée seulement par le chevron.

## Mouvement

Un seul moment orchestré : au premier affichage du cadre de téléphone, les trois marques de surligneur se posent une à une sur l'avant (trait qui s'étire de gauche à droite, 240 ms chacune, décalées de 160 ms). Rien d'autre ne bouge sans action. Le curseur répond au doigt sans délai. `prefers-reduced-motion: reduce` coupe tout : marques posées d'office, aucune transition.

## Revue du plan contre les défauts génériques (fait avant le code)

1. Premier jet : fond crème chaud + serif très contrastée en titre + accent terre cuite. C'est le cliché n°1 des pages générées. **Changé** : papier froid légèrement vert, titre en grotesque, serif réservée au texte, accent surligneur qui a une fonction (marquer).
2. Premier jet : bouton « M'écrire → » avec flèche ajoutée. **Changé** : pas de flèche décorative, le libellé dit ce qui arrive.
3. Premier jet : trois cartes d'offre (390 / 790 / 29). C'est le kit SaaS. **Changé** : un seul prix héros, les deux autres en lignes calmes sous lui, parce que l'offre, c'est 390 € ; le reste est la suite.
4. Premier jet : défilé des captures de sites en fond de héros (ce que fait le site actuel). **Écarté** : il montre des sites finis, pas le changement, et pèse lourd sur le téléphone.

## Poids

Polices auto-hébergées (3 fichiers woff2, 214 Ko). Captures en WebP recompressées, dimension native 2x du rendu au plus, chargement différé sous le premier écran. Budget accueil téléphone : 1,5 Mo, visé sous 900 Ko.

## Retouche du 24/09 après-midi : le feutre remplace le surligneur sur l'avant/après

Demande de Nicolas : l'effet d'une capture sur laquelle quelqu'un a écrit à la main. Le surligneur reste l'accent de la page (le prix), il quitte l'avant/après. Deux encres de correcteur s'ajoutent, réservées à ce seul bloc : rouge `#B3261E` (défaut) et vert `#1D6B3C` (réussite). Troisième famille, **Caveat Brush**, uniquement pour ces six notes : un feutre, pas une signature. Flèches : trait de 11 unités du repère (2,6 px au téléphone, 3,3 px au bureau), bouts ronds, pointe ouverte à deux branches inégales, liseré papier. Un seul moment de mouvement : les flèches se tracent l'une après l'autre quand le téléphone arrive à l'écran, puis à chaque bascule.
