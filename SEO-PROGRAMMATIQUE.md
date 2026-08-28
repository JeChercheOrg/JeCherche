# SEO programmatique — Pages hub `/recherche`

> Branche : `feat/programmatic-seo-hubs` (partie du dernier commit de `develop`).
> Objectif : générer automatiquement des pages d'atterrissage longue traîne pour
> capter le trafic organique des acheteurs **et** des vendeurs, sans intervention
> manuelle et sans modifier la base Supabase.

## 1. Idée

VendsMoi est une marketplace inversée : **la demande est le contenu**. On expose
donc chaque intention de recherche sur une URL dédiée, indexable et maillée, au
lieu de la cacher derrière des filtres en `?query=` (non indexables, car le
`canonical` de `/listings` supprime les paramètres).

Deux intentions captées :

- **Acheteurs** : « recherche `<catégorie>` (à `<ville>`) ».
- **Vendeurs** (angle inédit) : « qui cherche `<catégorie>` à `<ville>` ? » — un
  vendeur qui google cela tombe sur une page pleine d'acheteurs potentiels.

## 2. Architecture des URLs

Toutes les routes sont préfixées par la locale (`localePrefix: "always"`).

| Type | Route | Exemple |
| --- | --- | --- |
| Annuaire (hub d'entrée) | `/[locale]/recherche` | `/fr/recherche` |
| Catégorie | `/[locale]/recherche/[category]` | `/fr/recherche/jeux-video` |
| Ville | `/[locale]/recherche/villes/[city]` | `/fr/recherche/villes/auboue` |
| Catégorie × ville | `/[locale]/recherche/[category]/[city]` | `/fr/recherche/jeux-video/auboue` |

**Désambiguïsation des routes** : le segment statique `villes` a priorité sur le
segment dynamique `[category]` dans Next. `/recherche/villes/lyon` résout donc la
route ville, et `/recherche/velos/lyon` la route catégorie×ville. Aucune
catégorie ne s'appelle « villes » (garde défensive `slug === CITY_SEGMENT →
notFound()` en plus).

## 3. Slugs — sans modification de la base

La table `categories` n'a **pas** de colonne `slug` (le filtre existant utilise
l'UUID `category_id`). Plutôt que d'ajouter une colonne (donc une migration +
sauvegarde), les slugs sont **dérivés à la volée** :

- `slugify(nom localisé)` → slug **localisé** par langue :
  `Jeux vidéo → jeux-video` (fr), `Video Games → video-games` (en), etc.
- Résolution slug → catégorie : on charge les 10 catégories et on compare les
  slugs (peu coûteux). Idem pour les villes, dérivées des valeurs `listings.city`
  (texte libre) en regroupant par slug et en gardant l'orthographe la plus
  fréquente comme libellé canonique.

➡️ **Aucune écriture Supabase. La feature est 100 % en lecture seule.**

## 4. Anti « thin content »

Google pénalise les pages vides/dupliquées. Règles appliquées :

- **Catégorie** : la page existe toujours (hub de navigation), mais passe en
  `robots: noindex, follow` quand elle a 0 annonce active, et n'entre au sitemap
  que si elle a ≥ 1 annonce active.
- **Ville** et **catégorie × ville** : `notFound()` s'il n'y a aucune annonce
  active correspondante → ces pages ont donc toujours du contenu réel.
- Le sitemap est **entièrement piloté par le contenu** : seules les combinaisons
  existantes y figurent (avec le slug **localisé** par langue).

Chaque page hub est unique : H1 + intro dynamique (compteur pluralisé), encart
vendeur, grille d'annonces, FAQ (JSON-LD `FAQPage`), maillage interne, fil
d'Ariane.

## 5. Données structurées & metadata

- `generateMetadata` par page : `title`/`description` (namespace `SEO`, avec
  placeholders), `canonical` auto-référent, `alternates.languages` (hreflang avec
  les slugs localisés), Open Graph.
- JSON-LD : `ItemList` (les annonces), `FAQPage`, `BreadcrumbList` (via
  `Breadcrumbs`).

## 6. Maillage interne (crawlabilité)

- Nouvel **annuaire** `/recherche` : toutes les catégories + top 30 villes.
- `/listings` (page indexée) : bloc de liens vers chaque hub catégorie + lien vers
  l'annuaire.
- Chaque page hub : sections « Autres catégories », « `<cat>` par ville »,
  « Villes populaires », « Catégories à `<ville>` » — uniquement vers des combos
  non vides.
- `sitemap.ts` : index + catégories + villes + catégories×villes × 4 locales.

## 7. i18n

Nouvelles clés dans `messages/{fr,en,es,de}.json` :

- namespace `SEO` : titres/descriptions des 4 types de hub.
- namespace `Hub` (35 clés) : libellés on-page, intros pluralisées (ICU
  `plural` avec `=0/=1/other`), CTA vendeur, FAQ.

## 8. Fichiers

**Ajoutés**

- `lib/hubs.ts` — slugify, résolution catégorie/ville, requêtes hub (lecture seule).
- `components/hub-view.tsx` — corps partagé d'une page hub.
- `app/[locale]/recherche/page.tsx` — annuaire.
- `app/[locale]/recherche/[category]/page.tsx` — hub catégorie.
- `app/[locale]/recherche/villes/[city]/page.tsx` — hub ville.
- `app/[locale]/recherche/[category]/[city]/page.tsx` — hub catégorie×ville.

**Modifiés**

- `components/pagination.tsx` — prop `basePath` optionnelle (rétro-compatible).
- `app/sitemap.ts` — ajout des URLs hub, gé par le contenu réel.
- `app/[locale]/listings/page.tsx` — bloc de maillage vers les hubs.
- `messages/{fr,en,es,de}.json` — traductions `SEO` + `Hub`.

## 9. Validation

- `npm run build` : ✅ TypeScript OK, les 4 routes présentes en dynamique (`ƒ`).
- Lint : les seules erreurs/avertissements sont **préexistants** (fichiers non
  touchés) ; aucun sur le code ajouté.
- Smoke test (`next start`, données réelles) :
  - `/fr/recherche` rend l'annuaire (catégories + Auboué).
  - `/fr/recherche/jeux-video`, `/en/recherche/video-games` rendent le hub.
  - hub catégorie vide → `<meta name="robots" content="noindex, follow">`.
  - slug invalide → page 404 localisée (soft-404 `noindex`, comme le reste du site).
  - `sitemap.xml` liste index + catégories + ville + catégorie×ville, slugs
    localisés par langue.

## 10. Limites & pistes

- **Soft-404** (HTTP 200) sur slug invalide : comportement déjà connu du projet
  (réponse streamée via `loading.tsx`), atténué par le `noindex` automatique.
- Correspondance ville par `ilike` exact sur le libellé canonique : robuste pour
  des villes normalisées (autocomplétion BAN) ; les variantes orthographiques
  d'une même ville ne sont pas fusionnées côté requête.
- Micro-optimisation possible : mémoïser `fetchCategories`/`getCityHubs` (React
  `cache`) pour dédupliquer entre `generateMetadata` et la page.
- **Amorçage** : l'impact SEO dépend du volume d'annonces réelles (cf. « seed de
  contenu »). Aujourd'hui, 3 annonces actives → quelques hubs indexables.
- Prochaine brique possible : images Open Graph dynamiques par hub.
