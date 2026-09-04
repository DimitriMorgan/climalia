# Notes de bord — Climalia

Journal des travaux, décisions et pistes d'amélioration (techniques et fonctionnelles).
Tenu au fil de l'eau — les entrées les plus récentes en haut de chaque section.

## Journal

### 2026-09-04 — Vérification avant reprise sur un autre poste

Contrôle demandé par Dimitri (« vérifie que tout est push »). Résultat : **rien n'est poussé**.

- **Aucun dépôt distant configuré** : `git remote -v` est vide, `master` n'a pas d'upstream,
  aucun tag, aucune stash. Les 45 commits existants ne vivent que dans le `.git` local
  (4,5 Mo). Un `git clone` depuis l'autre poste est donc impossible en l'état.
- **115 entrées en attente** : 60 fichiers modifiés (+7118 / −785) et 57 fichiers non suivis
  (~6209 lignes) — tout le lot phases 1→3 plus le lot du 2026-07-07 (pages admin, clients,
  contenu, médias, comptes, mailers, `DemoSeeder`, 4 migrations, ce fichier de notes).
- **À recréer sur le nouveau poste** (ignorés à raison, donc absents du dépôt) :
  `backend/config/jwt/private.pem` + `public.pem` (appartiennent à root, générés dans le
  conteneur), le `.env` racine (ne diffère de `.env.example` que par `HTTP_PORT=8001`),
  `backend/vendor/`, `frontend/node_modules/`. `.env.prod` et `backend/.env.local`
  n'existent pas localement.
- **`backend/.env` est versionné et contient `JWT_PASSPHRASE` en clair** (passphrase de dev
  liée au `private.pem` local). Sans impact en prod, surchargé par `.env.prod`, mais à vider
  avant tout push vers un dépôt public.
- `backend/public/uploads/.gitignore` (`*` + `!.gitignore`) est lui-même non suivi : il doit
  entrer dans le commit, sinon les uploads finiraient versionnés sur l'autre machine.
- Rien de volumineux ni de binaire dans les fichiers non suivis : le plus gros est
  `ComptesAdminPage.tsx` (28 Ko). Le dépôt reste léger.
- Contrôles lancés sur le working tree non commité : PHPStan niveau 8 **OK** sur 51 fichiers,
  `tsc -b` **OK**, Jest **24/24**. Seul échec : `make lint-front`, une erreur ESLint
  `@typescript-eslint/no-dynamic-delete` sur `ContentAdminPage.tsx:75` dans `pushPreview`.
  La suite PHPUnit n'a pas été lancée : sans `.env.test` dédié ni DAMA, les tests
  fonctionnels écrivent dans la base de dev.
- Au passage : le bind-mount `./backend:/app` du conteneur `frankenphp` était vide après
  13 h d'uptime, `/app` ne montrait que les volumes `var` et `vendor`. Le quirk WSL2 déjà
  connu. Corrigé par `docker compose up -d --force-recreate frankenphp`. `postgres` était
  aussi arrêté, d'où le conteneur `unhealthy`.

Suite, même jour — mise en ligne effectuée :

- Dépôt distant `git@github.com:DimitriMorgan/climalia.git` fourni par Dimitri. Il ne
  contenait qu'un commit `Initial commit` avec un README placeholder de 2 lignes, vérifié
  avant écrasement. Décision assumée : garder `JWT_PASSPHRASE` dans `backend/.env`, le
  dépôt est privé.
- Les 115 changements découpés en **10 commits thématiques** (deps backend, modèle de
  données, API, tests backend, couche API front, site public, espace pro, tests front,
  infra, journal) puis poussés avec `--force-with-lease`. Local et distant sur `f23a904`,
  207 fichiers versionnés, arbre propre, `master` suit `origin/master`.
- Vérifié après push : aucun `vendor/`, `node_modules/`, `.env.local`, `.pem` ni image
  d'upload dans l'arbre versionné.
- **Correctif ESLint** : `pushPreview` de `ContentAdminPage` construit désormais `merged`
  par `Object.fromEntries` + filtrage au lieu d'un `delete` dynamique. Sémantique
  identique : un brouillon vide ou revenu au défaut retire la clé, override compris.
- **Correctif sécurité** : une revue automatique a relevé que `DocumentViewer` plaçait
  l'URL d'un document externe dans un `href` sans la garde `isSafeHttpUrl` qu'utilise le
  chemin de téléchargement. Non exploitable en l'état — `fileUrl` n'est écrit par aucun
  endpoint, les deux chemins de création le mettent à `null` et le `DemoSeeder` efface
  toute valeur hors `https://files.climalia.test/`. Asymétrie fermée quand même :
  `isSafeHttpUrl` est exporté depuis `api/documents` et appliqué à la source, une URL non
  http(s) bascule la vue en `unavailable`.
- Contrôles après correctifs : `make lint-front` **0 erreur** (4 warnings `react-refresh`
  préexistants), `tsc -b` **OK**, Jest **24/24**, PHPStan niveau 8 **OK**.

### 2026-07-07 — Tour du projet + lot de features admin

État des lieux fait par rapport à la liste de Dimitri :

| Demande | État au 2026-07-07 |
|---|---|
| Aperçu live du contenu avant enregistrement | Déjà codé (`/espace-pro/contenu`, iframe + postMessage) mais **pas encore déployé en prod** (le bundle prod date d'avant l'ajout de l'aperçu — vérifié : `content-preview` absent de `assets/index-BcO2jmtO.js`) |
| Photo avant facultative (back + front) | Déjà fait : nullable en base/DTO, formulaire admin permet le retrait, modale publique gère la photo unique |
| Prévisualisation document en modale | À faire (aujourd'hui : navigation vers la page détail) |
| Devis : bouton Répondre | À faire — décision : **réponse in-app** (envoi serveur via Mailer, statut auto « Contacté ») plutôt que mailto |
| Calendrier admin lié aux documents | À faire — décision : **date métier éditable** (nouveau champ `documentDate` nullable), le calendrier affiche les documents à cette date |
| Éditeur sans accès documents | À moitié : l'API ne lui renvoie rien (voter) mais l'onglet + la route + l'endpoint restent accessibles → à verrouiller |
| Carrousel images admin réalisations | À faire (vignette non cliquable) |

Travaux du jour — tout est fait, vérifié et non commité (comme le reste du working tree) :

- [x] Création de ce fichier de notes.
- [x] **Éditeur verrouillé hors documents** : onglet retiré de la nav (`ProShell`),
  routes `/espace-pro/dashboard` + `/espace-pro/documents/:id` restreintes
  (`App.tsx`), API documents limitée à ADMIN/EMPLOYEE/PARTNER/CLIENT
  (`security.yaml`) + test fonctionnel 403.
- [x] **Aperçu document en modale** : viewer (zoom/rotation/téléchargement) extrait
  en `DocumentViewer` partagé ; `DocumentPreviewModal` ouverte depuis le titre ou
  le bouton « Aperçu » du listing — on reste sur le dashboard. La page détail
  (deep-link) réutilise le même viewer. Labels de catégories centralisés
  (`features/documents/labels.ts`, ils étaient dupliqués dans 4 fichiers).
- [x] **Devis — bouton Répondre** : endpoint `POST /api/contact/{id}/reply` (ADMIN),
  envoi par `ContactReplyMailer` (from no-reply, **Reply-To = l'admin connecté**),
  passage auto NEW → CONTACTED + champ `repliedAt` (migration) ; modale front
  pré-remplie (objet + corps), badge « Répondu le … » sur les cartes.
  ⚠ Au passage : la règle `security.yaml` `^/api/contact` PUBLIC_ACCESS en POST
  couvrait aussi les sous-routes → ancrée en `^/api/contact$` (sinon /reply
  aurait été public). Testé : reply sans token = 401, formulaire public = 201.
- [x] **Date métier + calendrier admin** : champ `documentDate` nullable sur
  `Document` (migration commune avec `replied_at`), exposé partout, posable au
  dépôt (champ optionnel), éditable par l'admin dans la modale d'aperçu
  (`PATCH /api/documents/{id}`, ADMIN only) ; page `/espace-pro/calendrier`
  (vue mois lundi-first, chips cliquables → modale, liste « documents sans
  date » pour les rattacher). Seeder : plannings/attestations/rapports datés
  sur le mois courant.
- [x] **Carrousel admin réalisations** : vignette du listing cliquable → lightbox
  avant/après (flèches boutons + clavier, points, Échap). L'« avant » restant
  facultatif, la vignette n'est cliquable que s'il y a ≥ 1 photo.
- [x] **Vérifications** : PHPStan niveau 8 OK ; PHPUnit 85 tests OK (2 flaky infra
  re-passés isolément — connu) ; tsc + eslint 0 erreur ; Jest 24 tests OK
  (test DocumentList réécrit pour la modale) ; smoke tests API réels (403
  éditeur, PATCH date, reply 401/200, formulaire public 201) ; parcours UI
  complet en Chromium headless avec captures (modale doc + éditeur de date,
  calendrier, modale répondre, carrousel, nav éditeur réduite à
  Réalisations/Contenu, /dashboard le redirige vers l'accueil).

**Déployé en prod le 2026-07-07 au soir** (`./scripts/deploy.sh`) et vérifié en
ligne : nouveau bundle avec aperçu live du contenu + calendrier + modales +
carrousel, migrations appliquées, éditeur → 403 sur les documents, reply
protégé (401 sans token), formulaire public toujours OK (201 — une demande de
test « Verif Prod » a été créée, à clôturer depuis la page Devis). NB : le seed
étant idempotent, les documents de démo existants n'ont **pas** de date métier
en prod — les poser à la main via la modale d'aperçu ou la page Calendrier.

## À faire en priorité

- **DNS e-mails (prochaine session)** : pour que les réponses aux devis et les
  notifications documents partent réellement, finir la config e-mail du domaine :
  choisir le relais SMTP, poser les enregistrements DNS (MX si réception,
  **SPF**, **DKIM**, DMARC) pour `climalia.fr` / le domaine d'envoi, puis définir
  `MAILER_DSN` sur le VPS (variable d'environnement lue par `compose.prod.yaml`,
  aujourd'hui `null://null` = aucun envoi). Tester : répondre à un devis et
  vérifier la délivrabilité (spam inclus).

## Pistes d'amélioration — fonctionnelles

- **Contenu du site : cliquer-pour-éditer** — dans l'aperçu live, cliquer sur un texte
  pourrait focus le champ correspondant à gauche (écarté pour l'instant, confort pur).
- **Vrai WYSIWYG riche** (gras, liens, listes) : écarté — imposerait de stocker du HTML
  en base (sanitisation, migration du mini-format `*accent*`). À reconsidérer seulement
  si le besoin éditorial dépasse les textes courts.
- **Devis : historique des échanges** — on stocke `repliedAt`, mais pas le corps des
  réponses. Si le besoin de traçabilité grandit : entité `ContactReply` (auteur, date,
  corps) + fil de discussion sous chaque demande.
- **Devis : envoi réel** — `MAILER_DSN` vaut `null://null` par défaut en prod : la
  réponse « part » sans erreur mais n'est pas délivrée. Configurer un vrai relais
  SMTP (variable `MAILER_DSN` sur le VPS) avant d'utiliser la fonction en réel.
- **Notifications e-mail à l'admin** quand une nouvelle demande de devis arrive
  (aujourd'hui il faut consulter la page).
- **Documents : corbeille / archivage** — aucune suppression de document n'existe côté
  admin ; prévoir suppression douce plutôt que destructive.
- **Calendrier : étendre aux échéances de devis** (deadline des ContactRequest) pour un
  agenda unique — écarté du premier jet, facile à ajouter ensuite.
- **Réalisations : galerie multi-photos** — le modèle est limité à 2 images
  (avant/après). Une collection ordonnée de photos par réalisation rendrait le carrousel
  vraiment utile côté public aussi.
- **Comptes : réinitialisation de mot de passe** en autonomie (aujourd'hui, à la main).

## Pistes d'amélioration — techniques

- **Tests fonctionnels sans base isolée** — ni `DATABASE_URL` dans `.env.test`, ni
  `dama/doctrine-test-bundle`, ni reset de schéma : PHPUnit tape dans la base de dev.
  À isoler avant de brancher une CI.
- **Pousser au fil de l'eau** — résolu le 2026-09-04 par la création du remote, mais le
  backlog avait atteint 115 fichiers non commités avant d'être sauvegardé. Committer par
  lots courts évite de reconstituer un découpage thématique après coup.
- **Garde d'URL à un seul endroit** — `isSafeHttpUrl` protège maintenant le téléchargement
  et la visionneuse. Toute nouvelle insertion d'une URL venant de la base dans un `href`,
  un `src` ou un `window.open` doit passer par cette fonction.
- **Déploiement : pas de versionning des releases** — deploy.sh rsync le working tree
  (y compris non commité). Risque d'écart entre git et prod ; brancher le deploy sur un
  commit/tag serait plus sûr.
- **Gros backlog non commité** : tout le lot phases 1→3 est en working tree. À committer
  par lots thématiques pour retrouver une historique lisible.
- **Pagination des listes API** (`/api/documents`, `/api/contact`, `/api/realizations`) :
  tout est renvoyé d'un bloc ; acceptable au volume actuel, à surveiller.
- **`DocumentController::list` filtre par voter en PHP** après un `findFiltered` SQL :
  si le volume de documents grossit, pousser les règles de visibilité dans la requête.
- **Tests front Cypress non exécutables dans le conteneur node** (binaire absent du
  volume) — installer via `CYPRESS_INSTALL_BINARY=0` documenté, mais un job CI dédié
  serait plus fiable.
- **`MAILER_DSN` en prod** : vérifier que la valeur prod pointe vers un vrai relais SMTP
  (les notifications documents + réponses devis en dépendent). Toute nouvelle variable
  `%env()%` doit être ajoutée au bloc `environment:` de `compose.prod.yaml` (leçon du
  bug `LOCK_DSN`).
- **Stats du dashboard en dur** (`12 / 14 / 240` interventions/sites/utilisateurs dans
  `DashboardPage`) : à brancher sur de vraies données ou à retirer.
