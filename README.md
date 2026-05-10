# Climalia

**Climalia** — artisan climaticien intervenant dans toute la France (installation et maintenance de climatisation, pompes à chaleur, VMC, en résidentiel et tertiaire). Ce dépôt héberge le site vitrine + l'API métier permettant aux employés et partenaires (syndics, bureaux d'études, gestionnaires) d'accéder à leurs documents (plannings, fiches techniques, contrats, rapports, factures…), au public de soumettre une demande de contact et de consulter le portfolio des réalisations.

## Stack technique

- **Backend** : Symfony 8 (PHP 8.4), Doctrine ORM 3, PostgreSQL 16, FrankenPHP (Caddy intégré)
- **Auth** : JWT (`lexik/jwt-authentication-bundle`) + voters Symfony, hash argon2id
- **Tests** : PHPUnit 13 + PHPStan niveau 8 (0 erreur)
- **Infra** : Docker Compose, Makefile, `start.ps1` Windows-friendly
- **Frontend** : React 19 — _phase 2, à venir_

## Setup local

### Prérequis
Docker Desktop (Windows / Mac / Linux). Aucune autre dépendance locale requise — tout tourne en conteneur.

### Démarrage Linux / macOS
```bash
cp .env.example .env          # déjà fait au premier clone si tu utilises start.ps1
make up                       # build + démarre la stack
make migrate                  # applique les migrations
make fresh                    # reset DB + migrations + fixtures démo
```

### Démarrage Windows (PowerShell)
```powershell
.\start.ps1 -Fresh            # bootstrap complet : Docker Desktop si nécessaire, build, migrations, fixtures
```

### Vérifier que tout tourne
```bash
curl -X POST http://localhost:8001/api/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"email":"admin@climalia.fr","password":"demo"}'
# → {"token":"eyJ..."}

curl http://localhost:8001/api/realizations
# → liste publique des réalisations
```

> 💡 **Port** : par défaut le `.env.example` utilise `HTTP_PORT=8000`. Si ce port est déjà pris sur ta machine (par un autre projet Symfony local par exemple), édite `.env` et choisis un autre port — le `.env` local est gitignoré.

## Identifiants démo

Tous les comptes ont le mot de passe `demo`.

| Rôle | Email |
| --- | --- |
| ADMIN | `admin@climalia.fr` |
| EMPLOYEE Île-de-France | `employe.idf@climalia.fr` |
| EMPLOYEE PACA | `employe.paca@climalia.fr` |
| EMPLOYEE Bretagne | `employe.bretagne@climalia.fr` |
| PARTNER syndic | `syndic@partner.fr` |
| PARTNER bureau d'études | `bureau-etudes@partner.fr` |
| PARTNER gestionnaire | `gestionnaire@partner.fr` |

## Commandes utiles

```bash
make help          # liste toutes les cibles
make up            # démarre la stack
make down          # arrête la stack
make logs          # logs temps réel
make bash-back     # shell dans le conteneur backend
make migrate       # applique les migrations Doctrine
make fresh         # reset DB → migrations → fixtures
make test-back     # PHPUnit (force APP_ENV=test)
make phpstan       # analyse statique niveau 8
make cache-clear   # vide le cache Symfony
```

## Endpoints API (préfixe `/api`)

| Méthode | Route | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | public | Login email + password → JWT |
| POST | `/api/auth/logout` | JWT | Logout (stateless : le client jette son token) |
| GET | `/api/auth/me` | JWT | Profil de l'utilisateur courant |
| GET | `/api/documents` | JWT | Liste filtrée par rôle (`category`, `dateFrom`, `dateTo`, `region`) |
| GET | `/api/documents/{id}/download` | JWT | Métadonnées du fichier (streaming binaire en phase 2) |
| POST | `/api/contact` | public | Demande de contact (rate-limit 5/15 min par IP) |
| GET | `/api/realizations` | public | Liste filtrée des réalisations (`type`, `equipmentType`, `region`) |

## Frontend (React 19 + Vite + TypeScript)

Code: `frontend/`. Bundler **Vite**, dev server sur `http://localhost:5175`, conteneur `node:22-alpine` (`docker compose up -d node`). TypeScript strict + `noUncheckedIndexedAccess` + ESLint flat config (`@typescript-eslint/strictTypeChecked`) + Prettier.

### Architecture

```
frontend/
├── src/
│   ├── api/         # client fetch typé (apiFetch + ApiError) + modules par ressource
│   ├── components/  # Layout, NavBar, Footer, ProtectedRoute, FranceMap
│   ├── features/    # auth, contact, documents, realizations, services
│   ├── pages/       # une page = une route React Router 7
│   ├── stores/      # zustand (authStore — JWT en mémoire uniquement)
│   └── types/       # DTOs miroirs des entités Symfony
├── tests/           # Jest 30 + RTL (env Node + per-file @jest-environment jsdom)
└── cypress/         # e2e (5 specs)
```

### Commandes

| Cible | Description |
| --- | --- |
| `make bash-front` | Shell dans le conteneur frontend |
| `make typecheck`  | `tsc -b --noEmit` (strict + `noUncheckedIndexedAccess`) |
| `make lint-front` | ESLint flat config |
| `make test-front` | Jest + React Testing Library |
| `make cypress`    | Cypress e2e (headless) |

(Toutes ces cibles passent par `docker compose exec node ...`. En direct sur l'hôte : `cd frontend && npm run typecheck` etc.)

### Identifiants démo (espace pro)

Mot de passe : `demo` pour tous.

| Rôle | Email |
| --- | --- |
| ADMIN | `admin@climalia.fr` |
| EMPLOYEE Île-de-France | `employe.idf@climalia.fr` |
| PARTNER syndic | `syndic@partner.fr` |

> ⚠️ Le JWT est conservé **en mémoire** via Zustand (pas de `localStorage`/`sessionStorage`). Un rafraîchissement de page déconnecte volontairement l'utilisateur — c'est un choix sécurité assumé en attendant la mise en place de cookies httpOnly côté Symfony.

### Couverture de tests

- **23 tests Jest** (6 suites) : authStore, apiFetch, ProtectedRoute, ContactForm, LoginForm, DocumentList.
- **5 specs Cypress** : soumission contact, login employé + dashboard, login partenaire + filtre région, redirection auth, expiration token + auto-logout.

## TODO (phases suivantes)

- [x] **Phase 2 — bootstrap** — Frontend React 19 + Vite + TS strict + JWT in-memory, routes publiques, espace pro, tests Jest + Cypress (cf. _Frontend_)
- [ ] **Phase 3** — Intégration design (palette, typo, animations, responsive) + déploiement Coolify
- [ ] Stockage de fichiers (S3 / Coolify object storage) pour le download réel des documents
- [ ] Mailer transactionnel (notifs de demande de contact)
- [ ] Déploiement Coolify avec FrankenPHP en mode worker
- [ ] CI : GitHub Actions (lint + tests + PHPStan)
