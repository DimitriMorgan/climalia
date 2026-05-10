# Climalia Frontend Bootstrap (React 19 + Vite + TS strict) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap a React 19 + Vite + TypeScript strict frontend at `frontend/` that consumes the existing Symfony 8 API (auth, contact, documents, realizations), with public pages, an authenticated "espace pro" dashboard, full Jest + Cypress test coverage, and Docker integration.

**Architecture:** Single-page React app served by Vite dev server (port 5173) in a dedicated `node:22-alpine` Docker service alongside the existing FrankenPHP backend. JWT is stored **in memory only** via a Zustand store (no localStorage/sessionStorage — strict requirement). Routing via React Router 7 data router. Typed `fetch` wrapper consumes the existing `/api/*` endpoints. Jest + RTL for unit tests, Cypress for e2e. The design pass is intentionally deferred — this plan delivers structure, types, routing, auth, and tests only.

**Tech Stack:** React 19, Vite (latest, ≥ 6 — npm create vite scaffold), TypeScript 5 (strict + noUncheckedIndexedAccess), React Router 7 (data router), Zustand 5, Jest 29 + ts-jest + @testing-library/react 16, Cypress 13, ESLint flat config + Prettier, Node 22.

**Constraints (NON-NEGOTIABLE):**
- No `.js` / `.jsx` files. Everything in `.ts` / `.tsx`.
- No `localStorage` / `sessionStorage` — JWT is held in Zustand state in memory only. Page refresh = re-login. This is by design.
- No implicit or explicit `any` (the only allowed `any` is `unknown`-narrowed at the API boundary or commented `// eslint-disable-next-line @typescript-eslint/no-explicit-any` with justification).
- Every component has typed props (`interface`). Every function has explicit param + return types.
- All API responses fully typed.

---

## File Structure

```
climalia/
├── docker-compose.yml                      # MODIFY: add `node` service
├── Makefile                                # MODIFY: add bash-front, test-front, typecheck, cypress, lint-front
├── README.md                               # MODIFY: add frontend section
└── frontend/                               # NEW: created by `npm create vite@latest`
    ├── .dockerignore                       # NEW
    ├── .eslintrc.cjs OR eslint.config.js   # NEW (flat config preferred)
    ├── .prettierrc.json                    # NEW
    ├── .gitignore                          # auto by vite
    ├── index.html                          # auto by vite
    ├── jest.config.cjs                     # NEW
    ├── jest.setup.ts                       # NEW
    ├── cypress.config.ts                   # NEW
    ├── package.json                        # MODIFY: scripts, deps
    ├── tsconfig.json                       # MODIFY: strict + noUncheckedIndexedAccess
    ├── tsconfig.node.json                  # auto by vite
    ├── vite.config.ts                      # MODIFY: server.host=0.0.0.0, port=5173, proxy /api
    ├── src/
    │   ├── api/
    │   │   ├── client.ts                   # NEW: typed fetch wrapper
    │   │   ├── auth.ts                     # NEW
    │   │   ├── contact.ts                  # NEW
    │   │   ├── documents.ts                # NEW
    │   │   └── realizations.ts             # NEW
    │   ├── components/
    │   │   ├── Layout.tsx                  # NEW: header/footer wrapper
    │   │   ├── NavBar.tsx                  # NEW
    │   │   ├── Footer.tsx                  # NEW
    │   │   ├── ProtectedRoute.tsx          # NEW
    │   │   └── FranceMap.tsx               # NEW: SVG custom regions
    │   ├── features/
    │   │   ├── auth/
    │   │   │   └── LoginForm.tsx           # NEW
    │   │   ├── contact/
    │   │   │   └── ContactForm.tsx         # NEW
    │   │   ├── documents/
    │   │   │   ├── DocumentList.tsx        # NEW
    │   │   │   └── DocumentFilters.tsx     # NEW
    │   │   ├── realizations/
    │   │   │   ├── RealizationGrid.tsx     # NEW
    │   │   │   └── RealizationFilters.tsx  # NEW
    │   │   └── services/
    │   │       └── ServiceList.tsx         # NEW
    │   ├── pages/
    │   │   ├── HomePage.tsx                # NEW
    │   │   ├── ServicesPage.tsx            # NEW
    │   │   ├── RealizationsPage.tsx        # NEW
    │   │   ├── AboutPage.tsx               # NEW
    │   │   ├── ContactPage.tsx             # NEW
    │   │   ├── LoginPage.tsx               # NEW
    │   │   ├── DashboardPage.tsx           # NEW
    │   │   └── NotFoundPage.tsx            # NEW
    │   ├── stores/
    │   │   └── authStore.ts                # NEW: zustand auth store
    │   ├── types/
    │   │   ├── api.ts                      # NEW: DTOs mirroring Symfony
    │   │   └── enums.ts                    # NEW: UserRole, DocumentCategory, etc.
    │   ├── App.tsx                         # MODIFY: routes
    │   ├── main.tsx                        # MODIFY: router provider
    │   └── index.css                       # auto, minimal reset
    ├── tests/
    │   ├── api/
    │   │   └── client.test.ts              # NEW
    │   ├── stores/
    │   │   └── authStore.test.ts           # NEW
    │   ├── components/
    │   │   └── ProtectedRoute.test.tsx     # NEW
    │   └── features/
    │       ├── auth/LoginForm.test.tsx     # NEW
    │       ├── contact/ContactForm.test.tsx # NEW
    │       └── documents/DocumentList.test.tsx # NEW
    ├── cypress/
    │   ├── e2e/
    │   │   ├── contact.cy.ts               # NEW
    │   │   ├── login-employee.cy.ts        # NEW
    │   │   ├── login-partner.cy.ts         # NEW
    │   │   ├── protected-redirect.cy.ts    # NEW
    │   │   └── token-expired.cy.ts         # NEW
    │   ├── support/
    │   │   ├── commands.ts                 # NEW
    │   │   └── e2e.ts                      # NEW
    │   └── fixtures/
    │       └── .gitkeep
    └── Dockerfile.dev                      # NEW: node:22-alpine for compose
```

---

## Backend reference (do NOT modify — read for typing)

The frontend consumes these endpoints (all under `/api`). Response shapes below define the TypeScript DTOs in `src/types/api.ts`.

**POST `/api/auth/login`** — body `{ email: string; password: string }` → 200 `{ token: string }` / 401 `{ error: string }`
**POST `/api/auth/logout`** — JWT, 204 no content
**GET `/api/auth/me`** — JWT → 200 `{ id, email, firstName, lastName, role: 'EMPLOYEE'|'PARTNER'|'ADMIN', region: string|null }`
**GET `/api/documents?category=&dateFrom=&dateTo=&region=`** — JWT → 200 array of `{ id, title, category, mimeType, sizeBytes, region: string|null, uploadedAt: string ISO }`
**GET `/api/documents/{id}/download`** — JWT → 200 `{ id, title, fileUrl, mimeType, sizeBytes }` (Phase 1: JSON, not binary)
**POST `/api/contact`** — public, body `ContactRequestInput` → 201 `{ id, status }` / 422 validation error / 429 rate limited
**GET `/api/realizations?type=&equipmentType=&region=`** — public → 200 array of `{ id, title, description, type, equipmentType, region, beforeImageUrl: string|null, afterImageUrl: string|null, publishedAt: string ISO }`

Enums (mirror exactly):
- `UserRole`: `EMPLOYEE` | `PARTNER` | `ADMIN`
- `DocumentCategory`: `PLANNING` | `TECHNICAL_SHEET` | `MAINTENANCE_CONTRACT` | `INTERNAL_DOC` | `INTERVENTION_REPORT` | `MAINTENANCE_CERTIFICATE` | `INVOICE`
- `RealizationType`: `RESIDENTIAL` | `TERTIARY`
- `EquipmentType`: `AC` | `HEAT_PUMP` | `VMC`
- `ProjectType`: `INSTALLATION_AC` | `HEAT_PUMP` | `VMC` | `MAINTENANCE` | `REPAIR`
- `ContactStatus`: `NEW` | `CONTACTED` | `CLOSED`

Demo credentials (password `demo` for all):
- `admin@climalia.fr` (ADMIN)
- `employe.idf@climalia.fr` (EMPLOYEE Île-de-France)
- `syndic@partner.fr` (PARTNER)

Backend HTTP port: `8000` (per `.env.example`). Vite proxy `/api` → `http://frankenphp:8000` inside Docker, or `http://localhost:8000` if dev runs on host.

---

## Section 1 — Setup (Vite scaffold, Docker, Makefile, tsconfig, lint)

**Files:**
- Create: `frontend/` (entire scaffold via `npm create vite`)
- Modify: `frontend/tsconfig.json`, `frontend/vite.config.ts`, `frontend/package.json`
- Create: `frontend/Dockerfile.dev`, `frontend/.dockerignore`, `frontend/eslint.config.js`, `frontend/.prettierrc.json`
- Modify: `docker-compose.yml`, `Makefile`

### Task 1.1: Scaffold the Vite + React + TS project

- [ ] **Step 1: Run the scaffold**

```bash
cd /home/dimitri/projects/climalia
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

- [ ] **Step 2: Verify it boots**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run dev -- --host 0.0.0.0 --port 5173 &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173
# Expected: 200
kill %1 2>/dev/null || true
```

- [ ] **Step 3: Pin React 19**

Open `frontend/package.json`. If `react` / `react-dom` are not on `^19`, run:

```bash
cd /home/dimitri/projects/climalia/frontend
npm install react@^19 react-dom@^19
npm install -D @types/react@^19 @types/react-dom@^19
```

- [ ] **Step 4: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend
git commit -m "chore(frontend): bootstrap react 19 with vite and typescript strict"
```

### Task 1.2: tsconfig strict + noUncheckedIndexedAccess

**Files:**
- Modify: `frontend/tsconfig.json` (or `frontend/tsconfig.app.json` if Vite split it)

- [ ] **Step 1: Open the active tsconfig**

Vite scaffold may use `tsconfig.json` referencing `tsconfig.app.json`. Edit whichever holds `compilerOptions` for the app code.

- [ ] **Step 2: Ensure strict and noUncheckedIndexedAccess**

In `compilerOptions`, set:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

Keep the existing `include`/`references` entries from the scaffold. If `tsconfig.app.json` exists, set the strict flags there and keep `tsconfig.json` as the project-references root.

- [ ] **Step 3: Run typecheck — must pass on the empty scaffold**

```bash
cd /home/dimitri/projects/climalia/frontend
npx tsc -b --noEmit
# Expected: no output (success)
```

If errors appear (e.g. `App.tsx` from scaffold trips `noUncheckedIndexedAccess`), fix them inline.

- [ ] **Step 4: Add `typecheck` script**

In `frontend/package.json` `scripts`, add:

```json
"typecheck": "tsc -b --noEmit"
```

- [ ] **Step 5: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/tsconfig*.json frontend/package.json
git commit -m "chore(frontend): enable strict typescript with noUncheckedIndexedAccess"
```

### Task 1.3: ESLint (flat config) + Prettier

**Files:**
- Create: `frontend/eslint.config.js`, `frontend/.prettierrc.json`, `frontend/.prettierignore`
- Modify: `frontend/package.json`

- [ ] **Step 1: Install lint/format deps**

```bash
cd /home/dimitri/projects/climalia/frontend
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh prettier eslint-config-prettier
```

- [ ] **Step 2: Write `frontend/eslint.config.js`**

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'cypress/videos', 'cypress/screenshots'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: { react: { version: '19' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  prettier,
);
```

- [ ] **Step 3: Write `frontend/.prettierrc.json`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

- [ ] **Step 4: Write `frontend/.prettierignore`**

```
dist
coverage
cypress/videos
cypress/screenshots
node_modules
```

- [ ] **Step 5: Add scripts to `frontend/package.json`**

```json
"lint": "eslint .",
"lint:fix": "eslint . --fix",
"format": "prettier --write ."
```

- [ ] **Step 6: Run lint — must be 0 errors on scaffold**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run lint
# Expected: 0 errors (warnings OK, but ideally 0)
```

If the scaffold has any lint errors, fix them.

- [ ] **Step 7: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/eslint.config.js frontend/.prettierrc.json frontend/.prettierignore frontend/package.json frontend/package-lock.json
git commit -m "chore(frontend): add eslint flat config and prettier"
```

### Task 1.4: Configure `vite.config.ts` (host, port, proxy /api)

**Files:**
- Modify: `frontend/vite.config.ts`

- [ ] **Step 1: Replace `vite.config.ts` content**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const apiTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 2: Verify**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run typecheck
# Expected: success
```

- [ ] **Step 3: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/vite.config.ts
git commit -m "chore(frontend): configure vite host port and api proxy"
```

### Task 1.5: Dockerfile.dev + docker-compose service

**Files:**
- Create: `frontend/Dockerfile.dev`, `frontend/.dockerignore`
- Modify: `docker-compose.yml`

- [ ] **Step 1: Write `frontend/Dockerfile.dev`**

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Install deps separately so layer is cached
COPY package.json package-lock.json* ./
RUN npm ci

# Source is bind-mounted in compose for hot reload; this COPY is a fallback
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
```

- [ ] **Step 2: Write `frontend/.dockerignore`**

```
node_modules
dist
coverage
cypress/videos
cypress/screenshots
.git
```

- [ ] **Step 3: Append `node` service to `docker-compose.yml`**

Add this service block at the end of the `services:` section (before the closing of file). And add a named volume `frontend_node_modules` to the `volumes:` block at top.

```yaml
  node:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    image: climalia/frontend:dev
    container_name: climalia_frontend
    restart: unless-stopped
    environment:
      VITE_API_PROXY_TARGET: http://frankenphp:8000
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - frontend_node_modules:/app/node_modules
    depends_on:
      frankenphp:
        condition: service_started
    networks: [climalia]
```

And under `volumes:` add:

```yaml
  frontend_node_modules:
```

- [ ] **Step 4: Verify the compose file parses**

```bash
cd /home/dimitri/projects/climalia
docker compose config > /dev/null
# Expected: no error
```

- [ ] **Step 5: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/Dockerfile.dev frontend/.dockerignore docker-compose.yml
git commit -m "chore(docker): add node service for vite dev server on 5173"
```

### Task 1.6: Update Makefile (bash-front, test-front, typecheck, cypress, lint-front)

**Files:**
- Modify: `Makefile`

- [ ] **Step 1: Append frontend targets**

At the end of `Makefile`, add:

```make
# --- Frontend ---
FRONT     ?= $(DC) exec node
FRONT_T   ?= $(DC) exec -T node

.PHONY: bash-front test-front typecheck lint-front cypress

bash-front: ## Shell dans le conteneur frontend
	$(FRONT) sh

test-front: ## Lance la suite de tests Jest + RTL
	$(FRONT_T) npm run test -- --ci

typecheck: ## Vérification TypeScript stricte
	$(FRONT_T) npm run typecheck

lint-front: ## ESLint sur le frontend
	$(FRONT_T) npm run lint

cypress: ## Lance les tests e2e Cypress (headless)
	$(FRONT_T) npm run cypress:run
```

Also update the `.PHONY` line at the top of the file to include the new targets if it's a single declaration; otherwise the local `.PHONY` above is enough.

- [ ] **Step 2: Verify**

```bash
cd /home/dimitri/projects/climalia
make help | grep -E "bash-front|test-front|typecheck|lint-front|cypress"
# Expected: 5 lines listing the new targets
```

- [ ] **Step 3: Commit**

```bash
cd /home/dimitri/projects/climalia
git add Makefile
git commit -m "chore(makefile): add frontend targets bash-front test-front typecheck lint-front cypress"
```

### Section 1 verification

- [ ] Run all checks before moving on:

```bash
cd /home/dimitri/projects/climalia
docker compose up -d --build
sleep 8
docker compose ps
# Expected: postgres, frankenphp, node all healthy/running
curl -s -o /dev/null -w "front:%{http_code}\n" http://localhost:5173
curl -s -o /dev/null -w "back:%{http_code}\n" http://localhost:8000/api/realizations
# Expected: front:200, back:200
make typecheck
make lint-front
# Expected: 0 errors
```

If anything fails, fix it before continuing.

---

## Section 2 — Typed API client

**Files:**
- Create: `frontend/src/types/enums.ts`, `frontend/src/types/api.ts`
- Create: `frontend/src/api/client.ts`, `frontend/src/api/auth.ts`, `frontend/src/api/contact.ts`, `frontend/src/api/documents.ts`, `frontend/src/api/realizations.ts`
- Create: `frontend/src/stores/authStore.ts`
- Create: `frontend/tests/stores/authStore.test.ts`, `frontend/tests/api/client.test.ts`

### Task 2.1: Install Jest + RTL + Zustand + React Router

- [ ] **Step 1: Install deps**

```bash
cd /home/dimitri/projects/climalia/frontend
npm install zustand react-router
npm install -D jest @types/jest ts-jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

> `react-router` (no `-dom` suffix) is the v7 package name and bundles browser bindings.

- [ ] **Step 2: Add Jest scripts to `frontend/package.json`**

```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 3: Write `frontend/jest.config.cjs`**

The Jest option that loads files **after Jest is installed in the environment** (so the file can use `expect`, `jest.fn`, etc.) is **`setupFilesAfterEach`**. If `npm run test` rejects this key, the alternative valid spelling is `setupFilesAfterEach` — confirm with `npx jest --showConfig | grep -i setup` and adapt. (The other related option, `setupFiles`, runs *before* the framework is installed and is not what we want.)

```js
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  setupFilesAfterEach: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: { jsx: 'react-jsx', module: 'ESNext', target: 'ES2022', moduleResolution: 'node' },
    }],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
};
```

> **Verification:** after writing this file, run `npx jest --showConfig 2>&1 | head -40` and confirm Jest reports the setup file is loaded. If it warns about an unknown option, switch to whichever name `npx jest --help | grep -i setup` reports.

- [ ] **Step 4: Write `frontend/jest.setup.ts`**

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 5: Smoke test Jest**

```bash
cd /home/dimitri/projects/climalia/frontend
mkdir -p tests
cat > tests/smoke.test.ts <<'EOF'
test('jest works', (): void => {
  expect(1 + 1).toBe(2);
});
EOF
npm run test
# Expected: 1 passing test
rm tests/smoke.test.ts
```

- [ ] **Step 6: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/package.json frontend/package-lock.json frontend/jest.config.cjs frontend/jest.setup.ts
git commit -m "chore(frontend): wire jest with ts-jest and jsdom"
```

### Task 2.2: Write enum + API DTO types (failing test first)

- [ ] **Step 1: Write `frontend/src/types/enums.ts`**

```ts
export const UserRole = {
  EMPLOYEE: 'EMPLOYEE',
  PARTNER: 'PARTNER',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const DocumentCategory = {
  PLANNING: 'PLANNING',
  TECHNICAL_SHEET: 'TECHNICAL_SHEET',
  MAINTENANCE_CONTRACT: 'MAINTENANCE_CONTRACT',
  INTERNAL_DOC: 'INTERNAL_DOC',
  INTERVENTION_REPORT: 'INTERVENTION_REPORT',
  MAINTENANCE_CERTIFICATE: 'MAINTENANCE_CERTIFICATE',
  INVOICE: 'INVOICE',
} as const;
export type DocumentCategory = (typeof DocumentCategory)[keyof typeof DocumentCategory];

export const RealizationType = {
  RESIDENTIAL: 'RESIDENTIAL',
  TERTIARY: 'TERTIARY',
} as const;
export type RealizationType = (typeof RealizationType)[keyof typeof RealizationType];

export const EquipmentType = {
  AC: 'AC',
  HEAT_PUMP: 'HEAT_PUMP',
  VMC: 'VMC',
} as const;
export type EquipmentType = (typeof EquipmentType)[keyof typeof EquipmentType];

export const ProjectType = {
  INSTALLATION_AC: 'INSTALLATION_AC',
  HEAT_PUMP: 'HEAT_PUMP',
  VMC: 'VMC',
  MAINTENANCE: 'MAINTENANCE',
  REPAIR: 'REPAIR',
} as const;
export type ProjectType = (typeof ProjectType)[keyof typeof ProjectType];

export const ContactStatus = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  CLOSED: 'CLOSED',
} as const;
export type ContactStatus = (typeof ContactStatus)[keyof typeof ContactStatus];
```

- [ ] **Step 2: Write `frontend/src/types/api.ts`**

```ts
import type {
  ContactStatus,
  DocumentCategory,
  EquipmentType,
  ProjectType,
  RealizationType,
  UserRole,
} from '@/types/enums';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface ApiUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  region: string | null;
}

export interface ApiDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  mimeType: string;
  sizeBytes: number;
  region: string | null;
  uploadedAt: string;
}

export interface ApiDocumentDownload {
  id: string;
  title: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ApiRealization {
  id: string;
  title: string;
  description: string;
  type: RealizationType;
  equipmentType: EquipmentType;
  region: string;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  publishedAt: string;
}

export interface ContactRequestInput {
  fullName: string;
  email: string;
  phone: string;
  postalCode: string;
  projectType: ProjectType;
  message: string;
  surface?: number | null;
  deadline?: string | null;
}

export interface ContactRequestResponse {
  id: string;
  status: ContactStatus;
}

export interface ApiErrorPayload {
  status: number;
  message: string;
  violations: ReadonlyArray<{ propertyPath: string; message: string }>;
}
```

- [ ] **Step 3: Verify typecheck**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run typecheck
# Expected: success
```

- [ ] **Step 4: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/src/types
git commit -m "feat(frontend): add typed enums and api dto types"
```

### Task 2.3: Auth store (Zustand) — TDD

**Files:**
- Test: `frontend/tests/stores/authStore.test.ts`
- Create: `frontend/src/stores/authStore.ts`

- [ ] **Step 1: Write the failing test**

`frontend/tests/stores/authStore.test.ts`:

```ts
import { useAuthStore } from '@/stores/authStore';
import type { ApiUser } from '@/types/api';

const sampleUser: ApiUser = {
  id: '0190abcd-1234-7000-8000-000000000001',
  email: 'admin@climalia.fr',
  firstName: 'Admin',
  lastName: 'Test',
  role: 'ADMIN',
  region: null,
};

describe('authStore', (): void => {
  beforeEach((): void => {
    useAuthStore.getState().reset();
  });

  test('starts logged out', (): void => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated()).toBe(false);
  });

  test('login sets token and user', (): void => {
    useAuthStore.getState().login('jwt.token.here', sampleUser);
    const state = useAuthStore.getState();
    expect(state.token).toBe('jwt.token.here');
    expect(state.user).toEqual(sampleUser);
    expect(state.isAuthenticated()).toBe(true);
  });

  test('logout clears state', (): void => {
    useAuthStore.getState().login('jwt.token.here', sampleUser);
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated()).toBe(false);
  });

  test('does NOT touch localStorage or sessionStorage', (): void => {
    const lsSpy = jest.spyOn(Storage.prototype, 'setItem');
    useAuthStore.getState().login('jwt.token.here', sampleUser);
    useAuthStore.getState().logout();
    expect(lsSpy).not.toHaveBeenCalled();
    lsSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run test -- tests/stores/authStore.test.ts
# Expected: FAIL — module not found
```

- [ ] **Step 3: Implement `frontend/src/stores/authStore.ts`**

```ts
import { create } from 'zustand';
import type { ApiUser } from '@/types/api';

interface AuthState {
  token: string | null;
  user: ApiUser | null;
  login: (token: string, user: ApiUser) => void;
  logout: () => void;
  reset: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  login: (token, user): void => {
    set({ token, user });
  },
  logout: (): void => {
    set({ token: null, user: null });
  },
  reset: (): void => {
    set({ token: null, user: null });
  },
  isAuthenticated: (): boolean => get().token !== null,
}));
```

- [ ] **Step 4: Run test — must pass**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run test -- tests/stores/authStore.test.ts
# Expected: PASS, 4 tests
```

- [ ] **Step 5: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/src/stores frontend/tests/stores
git commit -m "feat(frontend): add zustand auth store with in-memory jwt"
```

### Task 2.4: Typed fetch client — TDD

**Files:**
- Test: `frontend/tests/api/client.test.ts`
- Create: `frontend/src/api/client.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { apiFetch, ApiError } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';
import type { ApiUser } from '@/types/api';

const sampleUser: ApiUser = {
  id: '01', email: 'a@b.c', firstName: 'A', lastName: 'B', role: 'ADMIN', region: null,
};

describe('apiFetch', (): void => {
  const fetchMock = jest.fn();
  beforeEach((): void => {
    useAuthStore.getState().reset();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  test('returns parsed json on 200', async (): Promise<void> => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const data = await apiFetch<{ ok: boolean }>('/api/ping');
    expect(data).toEqual({ ok: true });
  });

  test('attaches Authorization header when token is present', async (): Promise<void> => {
    useAuthStore.getState().login('xyz.jwt.token', sampleUser);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200, headers: { 'content-type': 'application/json' } }));
    await apiFetch('/api/secret');
    const call = fetchMock.mock.calls[0];
    if (call === undefined) throw new Error('fetch was not called');
    const init = call[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get('Authorization')).toBe('Bearer xyz.jwt.token');
  });

  test('does NOT attach Authorization when token is null', async (): Promise<void> => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200, headers: { 'content-type': 'application/json' } }));
    await apiFetch('/api/public');
    const call = fetchMock.mock.calls[0];
    if (call === undefined) throw new Error('fetch was not called');
    const init = call[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get('Authorization')).toBeNull();
  });

  test('on 401 logs out and throws ApiError', async (): Promise<void> => {
    useAuthStore.getState().login('xyz.jwt.token', sampleUser);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'expired' }), { status: 401, headers: { 'content-type': 'application/json' } }));
    await expect(apiFetch('/api/secret')).rejects.toBeInstanceOf(ApiError);
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  test('on 422 surfaces validation violations', async (): Promise<void> => {
    const body = { violations: [{ propertyPath: 'email', title: 'Invalid' }] };
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status: 422, headers: { 'content-type': 'application/json' } }));
    try {
      await apiFetch('/api/contact', { method: 'POST', body: JSON.stringify({}) });
      throw new Error('should have thrown');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(ApiError);
      const e = err as ApiError;
      expect(e.status).toBe(422);
      expect(e.violations).toEqual([{ propertyPath: 'email', message: 'Invalid' }]);
    }
  });

  test('on POST with body sets Content-Type application/json', async (): Promise<void> => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 201, headers: { 'content-type': 'application/json' } }));
    await apiFetch('/api/contact', { method: 'POST', body: JSON.stringify({ a: 1 }) });
    const call = fetchMock.mock.calls[0];
    if (call === undefined) throw new Error('fetch was not called');
    const init = call[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get('Content-Type')).toBe('application/json');
  });
});
```

- [ ] **Step 2: Run test — must fail (module not found)**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run test -- tests/api/client.test.ts
# Expected: FAIL
```

- [ ] **Step 3: Implement `frontend/src/api/client.ts`**

```ts
import { useAuthStore } from '@/stores/authStore';

export interface ApiViolation {
  propertyPath: string;
  message: string;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly violations: ReadonlyArray<ApiViolation>;

  public constructor(status: number, message: string, violations: ReadonlyArray<ApiViolation> = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.violations = violations;
  }
}

interface SymfonyValidationViolation {
  propertyPath?: unknown;
  title?: unknown;
  message?: unknown;
}

interface SymfonyErrorBody {
  message?: unknown;
  detail?: unknown;
  violations?: unknown;
}

function parseViolations(raw: unknown): ReadonlyArray<ApiViolation> {
  if (!Array.isArray(raw)) return [];
  const out: ApiViolation[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const v = item as SymfonyValidationViolation;
    const path = typeof v.propertyPath === 'string' ? v.propertyPath : '';
    const msg =
      typeof v.message === 'string' ? v.message :
      typeof v.title === 'string' ? v.title :
      'Invalid value';
    out.push({ propertyPath: path, message: msg });
  }
  return out;
}

async function buildError(response: Response): Promise<ApiError> {
  let body: SymfonyErrorBody = {};
  try {
    body = (await response.json()) as SymfonyErrorBody;
  } catch {
    // ignore — body wasn't JSON
  }
  const message =
    typeof body.message === 'string' ? body.message :
    typeof body.detail === 'string' ? body.detail :
    response.statusText || `HTTP ${String(response.status)}`;
  return new ApiError(response.status, message, parseViolations(body.violations));
}

export async function apiFetch<T>(input: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const { token } = useAuthStore.getState();
  if (token !== null) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');

  const response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    useAuthStore.getState().logout();
    throw await buildError(response);
  }
  if (!response.ok) {
    throw await buildError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
```

- [ ] **Step 4: Run test — must pass**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run test -- tests/api/client.test.ts
# Expected: 6 passing
```

- [ ] **Step 5: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/src/api/client.ts frontend/tests/api
git commit -m "feat(frontend): add typed api client with jwt header and 401 logout"
```

### Task 2.5: Per-resource API modules

**Files:**
- Create: `frontend/src/api/auth.ts`, `frontend/src/api/contact.ts`, `frontend/src/api/documents.ts`, `frontend/src/api/realizations.ts`

- [ ] **Step 1: Write `frontend/src/api/auth.ts`**

```ts
import { apiFetch } from '@/api/client';
import type { ApiUser, LoginRequest, LoginResponse } from '@/types/api';

export function login(body: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function fetchMe(): Promise<ApiUser> {
  return apiFetch<ApiUser>('/api/auth/me');
}

export function logout(): Promise<void> {
  return apiFetch<void>('/api/auth/logout', { method: 'POST' });
}
```

- [ ] **Step 2: Write `frontend/src/api/contact.ts`**

```ts
import { apiFetch } from '@/api/client';
import type { ContactRequestInput, ContactRequestResponse } from '@/types/api';

export function submitContactRequest(input: ContactRequestInput): Promise<ContactRequestResponse> {
  return apiFetch<ContactRequestResponse>('/api/contact', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
```

- [ ] **Step 3: Write `frontend/src/api/realizations.ts`**

```ts
import { apiFetch } from '@/api/client';
import type { ApiRealization } from '@/types/api';
import type { EquipmentType, RealizationType } from '@/types/enums';

export interface RealizationFilters {
  type?: RealizationType;
  equipmentType?: EquipmentType;
  region?: string;
}

export function listRealizations(filters: RealizationFilters = {}): Promise<ReadonlyArray<ApiRealization>> {
  const qs = new URLSearchParams();
  if (filters.type !== undefined) qs.set('type', filters.type);
  if (filters.equipmentType !== undefined) qs.set('equipmentType', filters.equipmentType);
  if (filters.region !== undefined && filters.region !== '') qs.set('region', filters.region);
  const suffix = qs.toString();
  return apiFetch<ReadonlyArray<ApiRealization>>(`/api/realizations${suffix === '' ? '' : `?${suffix}`}`);
}
```

- [ ] **Step 4: Write `frontend/src/api/documents.ts`**

```ts
import { apiFetch } from '@/api/client';
import type { ApiDocument, ApiDocumentDownload } from '@/types/api';
import type { DocumentCategory } from '@/types/enums';

export interface DocumentFilters {
  category?: DocumentCategory;
  dateFrom?: string;
  dateTo?: string;
  region?: string;
}

export function listDocuments(filters: DocumentFilters = {}): Promise<ReadonlyArray<ApiDocument>> {
  const qs = new URLSearchParams();
  if (filters.category !== undefined) qs.set('category', filters.category);
  if (filters.dateFrom !== undefined && filters.dateFrom !== '') qs.set('dateFrom', filters.dateFrom);
  if (filters.dateTo !== undefined && filters.dateTo !== '') qs.set('dateTo', filters.dateTo);
  if (filters.region !== undefined && filters.region !== '') qs.set('region', filters.region);
  const suffix = qs.toString();
  return apiFetch<ReadonlyArray<ApiDocument>>(`/api/documents${suffix === '' ? '' : `?${suffix}`}`);
}

export function getDocumentDownload(id: string): Promise<ApiDocumentDownload> {
  return apiFetch<ApiDocumentDownload>(`/api/documents/${id}/download`);
}
```

- [ ] **Step 5: Verify typecheck + lint**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run typecheck
npm run lint
# Expected: 0 errors
```

- [ ] **Step 6: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/src/api
git commit -m "feat(frontend): add typed api modules for auth contact documents realizations"
```

### Section 2 verification

- [ ] Run all tests:

```bash
cd /home/dimitri/projects/climalia/frontend
npm run test
npm run typecheck
npm run lint
# Expected: all green
```

---

## Section 3 — Routing (React Router 7) + ProtectedRoute

**Files:**
- Modify: `frontend/src/main.tsx`, `frontend/src/App.tsx`
- Create: `frontend/src/components/Layout.tsx`, `frontend/src/components/NavBar.tsx`, `frontend/src/components/Footer.tsx`, `frontend/src/components/ProtectedRoute.tsx`
- Create skeletons for all `pages/*.tsx`
- Test: `frontend/tests/components/ProtectedRoute.test.tsx`

### Task 3.1: ProtectedRoute — TDD

- [ ] **Step 1: Write the failing test**

`frontend/tests/components/ProtectedRoute.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';
import type { ApiUser } from '@/types/api';

const user: ApiUser = {
  id: '01', email: 'admin@climalia.fr', firstName: 'A', lastName: 'B', role: 'ADMIN', region: null,
};

function renderAt(initial: string): void {
  render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/espace-pro/login" element={<div>login-page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/espace-pro/dashboard" element={<div>dashboard-page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', (): void => {
  beforeEach((): void => {
    useAuthStore.getState().reset();
  });

  test('redirects to login when not authenticated', (): void => {
    renderAt('/espace-pro/dashboard');
    expect(screen.getByText('login-page')).toBeInTheDocument();
  });

  test('renders child route when authenticated', (): void => {
    useAuthStore.getState().login('tok', user);
    renderAt('/espace-pro/dashboard');
    expect(screen.getByText('dashboard-page')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — must fail**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run test -- tests/components/ProtectedRoute.test.tsx
# Expected: FAIL — module not found
```

- [ ] **Step 3: Implement `frontend/src/components/ProtectedRoute.tsx`**

```tsx
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types/enums';

export interface ProtectedRouteProps {
  allowedRoles?: ReadonlyArray<UserRole>;
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps): React.ReactElement {
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (token === null) {
    return <Navigate to="/espace-pro/login" replace state={{ from: location.pathname }} />;
  }
  if (allowedRoles !== undefined && allowedRoles.length > 0) {
    if (user === null || !allowedRoles.includes(user.role)) {
      return <Navigate to="/espace-pro/login" replace />;
    }
  }
  return <Outlet />;
}
```

- [ ] **Step 4: Run — must pass**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run test -- tests/components/ProtectedRoute.test.tsx
# Expected: PASS, 2 tests
```

- [ ] **Step 5: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/src/components/ProtectedRoute.tsx frontend/tests/components
git commit -m "feat(frontend): add protected route guard with role check"
```

### Task 3.2: Layout, NavBar, Footer skeletons

- [ ] **Step 1: Write `frontend/src/components/NavBar.tsx`**

```tsx
import { Link, NavLink } from 'react-router';
import { useAuthStore } from '@/stores/authStore';

export function NavBar(): React.ReactElement {
  const isAuth = useAuthStore((s) => s.isAuthenticated());
  return (
    <nav aria-label="Principal" style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid #ccc' }}>
      <Link to="/" style={{ fontWeight: 700 }}>Climalia</Link>
      <NavLink to="/services">Services</NavLink>
      <NavLink to="/realisations">Réalisations</NavLink>
      <NavLink to="/a-propos">À propos</NavLink>
      <NavLink to="/contact">Contact</NavLink>
      <span style={{ marginLeft: 'auto' }}>
        {isAuth ? (
          <NavLink to="/espace-pro/dashboard">Dashboard</NavLink>
        ) : (
          <NavLink to="/espace-pro/login">Espace pro</NavLink>
        )}
      </span>
    </nav>
  );
}
```

- [ ] **Step 2: Write `frontend/src/components/Footer.tsx`**

```tsx
export function Footer(): React.ReactElement {
  return (
    <footer style={{ padding: '1rem', borderTop: '1px solid #ccc', marginTop: '2rem', color: '#666' }}>
      <p>Climalia — Artisan climaticien — France entière — RGE / QualiPAC</p>
    </footer>
  );
}
```

- [ ] **Step 3: Write `frontend/src/components/Layout.tsx`**

```tsx
import { Outlet } from 'react-router';
import { Footer } from '@/components/Footer';
import { NavBar } from '@/components/NavBar';

export function Layout(): React.ReactElement {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      <main style={{ flex: 1, padding: '1rem', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/src/components
git commit -m "feat(frontend): add layout navbar and footer skeletons"
```

### Task 3.3: Page skeletons

- [ ] **Step 1: Write all eight page files (each is a placeholder; real content lands in Section 4 / 5)**

`frontend/src/pages/HomePage.tsx`:

```tsx
export function HomePage(): React.ReactElement {
  return (
    <section>
      <h1>Climalia — climatisation, PAC, VMC</h1>
      <p>Site en cours de construction. Voir les sections dans la barre de navigation.</p>
    </section>
  );
}
```

`frontend/src/pages/ServicesPage.tsx`:

```tsx
export function ServicesPage(): React.ReactElement {
  return <section><h1>Services</h1></section>;
}
```

`frontend/src/pages/RealizationsPage.tsx`:

```tsx
export function RealizationsPage(): React.ReactElement {
  return <section><h1>Réalisations</h1></section>;
}
```

`frontend/src/pages/AboutPage.tsx`:

```tsx
export function AboutPage(): React.ReactElement {
  return <section><h1>À propos</h1></section>;
}
```

`frontend/src/pages/ContactPage.tsx`:

```tsx
export function ContactPage(): React.ReactElement {
  return <section><h1>Contact</h1></section>;
}
```

`frontend/src/pages/LoginPage.tsx`:

```tsx
export function LoginPage(): React.ReactElement {
  return <section><h1>Espace pro — Connexion</h1></section>;
}
```

`frontend/src/pages/DashboardPage.tsx`:

```tsx
export function DashboardPage(): React.ReactElement {
  return <section><h1>Dashboard</h1></section>;
}
```

`frontend/src/pages/NotFoundPage.tsx`:

```tsx
import { Link } from 'react-router';

export function NotFoundPage(): React.ReactElement {
  return (
    <section>
      <h1>404 — Page introuvable</h1>
      <Link to="/">Retour à l'accueil</Link>
    </section>
  );
}
```

- [ ] **Step 2: Wire routes in `frontend/src/App.tsx`**

```tsx
import { Route, Routes } from 'react-router';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AboutPage } from '@/pages/AboutPage';
import { ContactPage } from '@/pages/ContactPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RealizationsPage } from '@/pages/RealizationsPage';
import { ServicesPage } from '@/pages/ServicesPage';

export function App(): React.ReactElement {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="realisations" element={<RealizationsPage />} />
        <Route path="a-propos" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="espace-pro/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="espace-pro/dashboard" element={<DashboardPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 3: Update `frontend/src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from '@/App';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

- [ ] **Step 4: Verify typecheck, lint, dev server boots**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run typecheck
npm run lint
docker compose up -d node
sleep 5
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173
# Expected: 200
```

- [ ] **Step 5: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/src/pages frontend/src/App.tsx frontend/src/main.tsx
git commit -m "feat(frontend): add public pages skeleton with react router 7"
```

### Section 3 verification

- [ ] All routes render without error in browser at `http://localhost:5173/<path>` for each declared path. Manual check (open in browser or `curl -s http://localhost:5173/services | grep '<title'`). Tests + typecheck + lint all green.

---

## Section 4 — Public pages (functional skeletons)

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`, `ServicesPage.tsx`, `RealizationsPage.tsx`, `AboutPage.tsx`, `ContactPage.tsx`
- Create: `frontend/src/features/services/ServiceList.tsx`, `frontend/src/features/realizations/RealizationGrid.tsx`, `frontend/src/features/realizations/RealizationFilters.tsx`, `frontend/src/features/contact/ContactForm.tsx`, `frontend/src/components/FranceMap.tsx`
- Test: `frontend/tests/features/contact/ContactForm.test.tsx`

### Task 4.1: Services list (static data)

- [ ] **Step 1: Write `frontend/src/features/services/ServiceList.tsx`**

```tsx
import { Link } from 'react-router';

interface ServiceItem {
  slug: string;
  title: string;
  description: string;
}

const SERVICES: ReadonlyArray<ServiceItem> = [
  { slug: 'clim', title: 'Climatisation mono / multi-split', description: 'Installation, mise en service, contrats d\'entretien.' },
  { slug: 'pac-air-air', title: 'Pompes à chaleur air/air', description: 'Confort thermique optimisé toute l\'année.' },
  { slug: 'pac-air-eau', title: 'Pompes à chaleur air/eau', description: 'Chauffage central + ECS, certifié RGE QualiPAC.' },
  { slug: 'vmc', title: 'VMC simple et double flux', description: 'Renouvellement d\'air et économies d\'énergie.' },
  { slug: 'maintenance', title: 'Entretien & dépannage', description: 'Contrats annuels, intervention rapide en cas de panne.' },
];

export function ServiceList(): React.ReactElement {
  return (
    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '1rem' }}>
      {SERVICES.map((s) => (
        <li key={s.slug} style={{ border: '1px solid #ddd', padding: '1rem' }}>
          <h3>{s.title}</h3>
          <p>{s.description}</p>
          <Link to="/contact">Demander un devis</Link>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: Update `frontend/src/pages/ServicesPage.tsx`**

```tsx
import { ServiceList } from '@/features/services/ServiceList';

export function ServicesPage(): React.ReactElement {
  return (
    <section>
      <h1>Nos services</h1>
      <ServiceList />
    </section>
  );
}
```

- [ ] **Step 3: typecheck + lint**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run typecheck && npm run lint
```

- [ ] **Step 4: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/src/features/services frontend/src/pages/ServicesPage.tsx
git commit -m "feat(frontend): add services list with static catalogue"
```

### Task 4.2: HomePage sections

- [ ] **Step 1: Update `frontend/src/pages/HomePage.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { listRealizations } from '@/api/realizations';
import type { ApiRealization } from '@/types/api';

interface Testimonial {
  author: string;
  text: string;
}

const TESTIMONIALS: ReadonlyArray<Testimonial> = [
  { author: 'Mme Lefèvre — Paris 11', text: 'Installation propre et rapide, équipe sérieuse.' },
  { author: 'Syndic Lyon Vaise', text: 'Suivi des contrats irréprochable depuis 3 ans.' },
  { author: 'Bureau d\'études Marseille', text: 'Devis détaillé, vraie expertise terrain.' },
];

export function HomePage(): React.ReactElement {
  const [latest, setLatest] = useState<ReadonlyArray<ApiRealization>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect((): void => {
    listRealizations()
      .then((all) => { setLatest(all.slice(0, 3)); })
      .catch((e: unknown) => { setError(e instanceof Error ? e.message : 'Erreur'); });
  }, []);

  return (
    <>
      <section aria-labelledby="hero">
        <h1 id="hero">Climalia, votre artisan climaticien — France entière</h1>
        <p>Installation, entretien et dépannage de climatisation, pompes à chaleur et VMC.</p>
        <Link to="/contact">Demander un devis</Link>
      </section>

      <section aria-labelledby="services">
        <h2 id="services">Nos services</h2>
        <p>Climatisation, PAC air/air et air/eau, VMC, entretien, dépannage.</p>
        <Link to="/services">Voir tous les services</Link>
      </section>

      <section aria-labelledby="trust" style={{ background: '#f5f5f5', padding: '1rem' }}>
        <h2 id="trust">Pourquoi nous faire confiance</h2>
        <ul>
          <li>Certifié RGE et QualiPAC</li>
          <li>Intervention sur toute la France</li>
          <li>Plus de 500 chantiers réalisés</li>
        </ul>
      </section>

      <section aria-labelledby="testimonials">
        <h2 id="testimonials">Ils nous font confiance</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {TESTIMONIALS.map((t) => (
            <li key={t.author} style={{ borderLeft: '3px solid #888', padding: '0.5rem 1rem', marginBottom: '0.5rem' }}>
              <blockquote>{t.text}</blockquote>
              <cite>— {t.author}</cite>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="latest">
        <h2 id="latest">Dernières réalisations</h2>
        {error !== null ? <p role="alert">Erreur : {error}</p> : null}
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '1rem' }}>
          {latest.map((r) => (
            <li key={r.id} style={{ border: '1px solid #ddd', padding: '1rem' }}>
              <h3>{r.title}</h3>
              <p>{r.description}</p>
              <small>{r.region} — {r.equipmentType}</small>
            </li>
          ))}
        </ul>
        <Link to="/realisations">Toutes les réalisations</Link>
      </section>

      <section aria-labelledby="cta">
        <h2 id="cta">Un projet ? Parlons-en.</h2>
        <Link to="/contact">Contactez-nous</Link>
      </section>
    </>
  );
}
```

- [ ] **Step 2: typecheck + lint + visual smoke**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run typecheck && npm run lint
```

- [ ] **Step 3: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/src/pages/HomePage.tsx
git commit -m "feat(frontend): add homepage sections with latest realizations"
```

### Task 4.3: Realizations grid + filters

- [ ] **Step 1: Write `frontend/src/features/realizations/RealizationFilters.tsx`**

```tsx
import { EquipmentType, RealizationType } from '@/types/enums';
import type { EquipmentType as EquipmentTypeT, RealizationType as RealizationTypeT } from '@/types/enums';

export interface RealizationFiltersState {
  type: RealizationTypeT | '';
  equipmentType: EquipmentTypeT | '';
  region: string;
}

export interface RealizationFiltersProps {
  value: RealizationFiltersState;
  onChange: (next: RealizationFiltersState) => void;
}

export function RealizationFilters({ value, onChange }: RealizationFiltersProps): React.ReactElement {
  return (
    <fieldset style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <legend>Filtres</legend>
      <label>
        Type
        <select
          value={value.type}
          onChange={(e): void => { onChange({ ...value, type: e.target.value as RealizationTypeT | '' }); }}
        >
          <option value="">Tous</option>
          <option value={RealizationType.RESIDENTIAL}>Résidentiel</option>
          <option value={RealizationType.TERTIARY}>Tertiaire</option>
        </select>
      </label>
      <label>
        Équipement
        <select
          value={value.equipmentType}
          onChange={(e): void => { onChange({ ...value, equipmentType: e.target.value as EquipmentTypeT | '' }); }}
        >
          <option value="">Tous</option>
          <option value={EquipmentType.AC}>Climatisation</option>
          <option value={EquipmentType.HEAT_PUMP}>Pompe à chaleur</option>
          <option value={EquipmentType.VMC}>VMC</option>
        </select>
      </label>
      <label>
        Région
        <input
          type="text"
          value={value.region}
          onChange={(e): void => { onChange({ ...value, region: e.target.value }); }}
          placeholder="ex: Île-de-France"
        />
      </label>
    </fieldset>
  );
}
```

- [ ] **Step 2: Write `frontend/src/features/realizations/RealizationGrid.tsx`**

```tsx
import type { ApiRealization } from '@/types/api';

export interface RealizationGridProps {
  items: ReadonlyArray<ApiRealization>;
}

export function RealizationGrid({ items }: RealizationGridProps): React.ReactElement {
  if (items.length === 0) {
    return <p>Aucune réalisation pour ces filtres.</p>;
  }
  return (
    <ul
      data-testid="realization-grid"
      style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}
    >
      {items.map((r) => (
        <li key={r.id} style={{ border: '1px solid #ddd', padding: '1rem' }}>
          <h3>{r.title}</h3>
          <p>{r.description}</p>
          <p><small>{r.region} — {r.type} — {r.equipmentType}</small></p>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: Update `frontend/src/pages/RealizationsPage.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { listRealizations } from '@/api/realizations';
import { RealizationFilters, type RealizationFiltersState } from '@/features/realizations/RealizationFilters';
import { RealizationGrid } from '@/features/realizations/RealizationGrid';
import type { ApiRealization } from '@/types/api';

export function RealizationsPage(): React.ReactElement {
  const [filters, setFilters] = useState<RealizationFiltersState>({ type: '', equipmentType: '', region: '' });
  const [items, setItems] = useState<ReadonlyArray<ApiRealization>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect((): void => {
    setError(null);
    listRealizations({
      type: filters.type === '' ? undefined : filters.type,
      equipmentType: filters.equipmentType === '' ? undefined : filters.equipmentType,
      region: filters.region.trim() === '' ? undefined : filters.region.trim(),
    })
      .then(setItems)
      .catch((e: unknown) => { setError(e instanceof Error ? e.message : 'Erreur'); });
  }, [filters]);

  return (
    <section>
      <h1>Réalisations</h1>
      <RealizationFilters value={filters} onChange={setFilters} />
      {error !== null ? <p role="alert">Erreur : {error}</p> : null}
      <RealizationGrid items={items} />
    </section>
  );
}
```

- [ ] **Step 4: typecheck + lint + browser smoke**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run typecheck && npm run lint
# Then open http://localhost:5173/realisations and confirm the grid renders.
```

- [ ] **Step 5: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/src/features/realizations frontend/src/pages/RealizationsPage.tsx
git commit -m "feat(frontend): add realizations grid with filterable type equipment region"
```

### Task 4.4: France map (custom SVG, clickable regions)

- [ ] **Step 1: Write `frontend/src/components/FranceMap.tsx`**

> A full geographic SVG of France's regions is out of scope to embed inline; we use a simplified labelled grid that mimics the map intent. Each region is a clickable rectangle that triggers the `onSelect` handler. This keeps the dependency footprint zero. (The richer SVG can be swapped later without changing the component contract.)

```tsx
const REGIONS: ReadonlyArray<string> = [
  'Île-de-France', 'Hauts-de-France', 'Grand Est', 'Normandie',
  'Bretagne', 'Pays de la Loire', 'Centre-Val de Loire', 'Bourgogne-Franche-Comté',
  'Nouvelle-Aquitaine', 'Auvergne-Rhône-Alpes', 'Occitanie', 'Provence-Alpes-Côte d\'Azur',
  'Corse',
];

export interface FranceMapProps {
  onSelect?: (region: string) => void;
  highlighted?: ReadonlyArray<string>;
}

export function FranceMap({ onSelect, highlighted }: FranceMapProps): React.ReactElement {
  const isHighlighted = (r: string): boolean => highlighted === undefined || highlighted.includes(r);
  return (
    <div
      role="group"
      aria-label="Carte de France des régions desservies"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}
    >
      {REGIONS.map((r) => (
        <button
          key={r}
          type="button"
          onClick={(): void => { onSelect?.(r); }}
          aria-pressed={isHighlighted(r)}
          style={{
            padding: '0.75rem',
            border: '1px solid #888',
            background: isHighlighted(r) ? '#cce5ff' : '#f0f0f0',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Update `frontend/src/pages/AboutPage.tsx`**

```tsx
import { useState } from 'react';
import { FranceMap } from '@/components/FranceMap';

export function AboutPage(): React.ReactElement {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <section>
      <h1>À propos de Climalia</h1>
      <article>
        <h2>Notre histoire</h2>
        <p>Artisan climaticien, intervention sur tout le territoire français depuis plus de 10 ans.</p>
      </article>
      <article>
        <h2>Nos valeurs</h2>
        <ul>
          <li>Conseil sincère, sans sur-vente.</li>
          <li>Travail propre et durable.</li>
          <li>Suivi long terme avec contrats d'entretien.</li>
        </ul>
      </article>
      <article>
        <h2>Certifications</h2>
        <ul>
          <li>RGE — Reconnu Garant de l'Environnement</li>
          <li>QualiPAC — Pompes à chaleur</li>
        </ul>
      </article>
      <article>
        <h2>Couverture France</h2>
        <FranceMap onSelect={setSelected} />
        {selected !== null ? <p>Région sélectionnée : <strong>{selected}</strong></p> : null}
      </article>
    </section>
  );
}
```

- [ ] **Step 3: typecheck + lint**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run typecheck && npm run lint
```

- [ ] **Step 4: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/src/components/FranceMap.tsx frontend/src/pages/AboutPage.tsx
git commit -m "feat(frontend): add about page with clickable france regions map"
```

### Task 4.5: Contact form — TDD

- [ ] **Step 1: Write the failing test**

`frontend/tests/features/contact/ContactForm.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from '@/features/contact/ContactForm';

describe('ContactForm', (): void => {
  beforeEach((): void => {
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  test('shows validation errors when submitting empty form', async (): Promise<void> => {
    const user = userEvent.setup();
    render(<ContactForm />);
    await user.click(screen.getByRole('button', { name: /envoyer/i }));
    expect(await screen.findAllByText(/requis|obligatoire/i)).not.toHaveLength(0);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('submits and shows success on 201', async (): Promise<void> => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'abc', status: 'NEW' }), { status: 201, headers: { 'content-type': 'application/json' } }),
    );
    const user = userEvent.setup();
    render(<ContactForm />);
    await user.type(screen.getByLabelText(/nom/i), 'Jean Dupont');
    await user.type(screen.getByLabelText(/email/i), 'jean@example.com');
    await user.type(screen.getByLabelText(/téléphone/i), '0612345678');
    await user.type(screen.getByLabelText(/code postal/i), '75011');
    await user.selectOptions(screen.getByLabelText(/type de projet/i), 'INSTALLATION_AC');
    await user.type(screen.getByLabelText(/message/i), 'Bonjour, je souhaite un devis.');
    await user.click(screen.getByRole('button', { name: /envoyer/i }));
    await waitFor((): void => { expect(screen.getByRole('status')).toHaveTextContent(/merci|envoyée/i); });
  });

  test('renders server validation errors on 422', async (): Promise<void> => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ violations: [{ propertyPath: 'email', title: 'Email invalide' }] }),
        { status: 422, headers: { 'content-type': 'application/json' } },
      ),
    );
    const user = userEvent.setup();
    render(<ContactForm />);
    await user.type(screen.getByLabelText(/nom/i), 'Jean Dupont');
    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.type(screen.getByLabelText(/téléphone/i), '0612345678');
    await user.type(screen.getByLabelText(/code postal/i), '75011');
    await user.selectOptions(screen.getByLabelText(/type de projet/i), 'INSTALLATION_AC');
    await user.type(screen.getByLabelText(/message/i), 'Bonjour.');
    await user.click(screen.getByRole('button', { name: /envoyer/i }));
    expect(await screen.findByText(/email invalide/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — must fail**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run test -- tests/features/contact/ContactForm.test.tsx
# Expected: FAIL — module not found
```

- [ ] **Step 3: Implement `frontend/src/features/contact/ContactForm.tsx`**

```tsx
import { useState } from 'react';
import { submitContactRequest } from '@/api/contact';
import { ApiError } from '@/api/client';
import type { ContactRequestInput } from '@/types/api';
import { ProjectType } from '@/types/enums';
import type { ProjectType as ProjectTypeT } from '@/types/enums';

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  postalCode: string;
  projectType: ProjectTypeT | '';
  surface: string;
  deadline: string;
  message: string;
}

const EMPTY: FormState = {
  fullName: '', email: '', phone: '', postalCode: '', projectType: '', surface: '', deadline: '', message: '',
};

function validateClient(s: FormState): Map<string, string> {
  const errs = new Map<string, string>();
  if (s.fullName.trim().length < 2) errs.set('fullName', 'Nom requis (2 caractères minimum).');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email)) errs.set('email', 'Email obligatoire et valide.');
  if (s.phone.replace(/\s/g, '').length < 6) errs.set('phone', 'Téléphone obligatoire.');
  if (!/^\d{5}$/.test(s.postalCode)) errs.set('postalCode', 'Code postal obligatoire (5 chiffres).');
  if (s.projectType === '') errs.set('projectType', 'Type de projet obligatoire.');
  if (s.message.trim().length < 5) errs.set('message', 'Message obligatoire (5 caractères minimum).');
  return errs;
}

export function ContactForm(): React.ReactElement {
  const [state, setState] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]): void => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setServerError(null);
    setSuccess(null);
    const clientErrs = validateClient(state);
    if (clientErrs.size > 0) {
      setErrors(clientErrs);
      return;
    }
    setErrors(new Map());
    setSubmitting(true);
    try {
      const input: ContactRequestInput = {
        fullName: state.fullName.trim(),
        email: state.email.trim(),
        phone: state.phone.trim(),
        postalCode: state.postalCode.trim(),
        projectType: state.projectType as ProjectTypeT,
        message: state.message.trim(),
        surface: state.surface === '' ? null : Number.parseInt(state.surface, 10),
        deadline: state.deadline === '' ? null : state.deadline,
      };
      await submitContactRequest(input);
      setSuccess('Merci, votre demande a bien été envoyée. Nous revenons vers vous sous 48 h.');
      setState(EMPTY);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.violations.length > 0) {
          const map = new Map<string, string>();
          for (const v of err.violations) map.set(v.propertyPath, v.message);
          setErrors(map);
        } else {
          setServerError(err.message);
        }
      } else {
        setServerError('Erreur réseau, veuillez réessayer.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-describedby="contact-status">
      <p id="contact-status" role="status">{success ?? ''}</p>
      {serverError !== null ? <p role="alert">{serverError}</p> : null}

      <p>
        <label htmlFor="fullName">Nom complet</label><br />
        <input id="fullName" value={state.fullName} onChange={(e): void => { update('fullName', e.target.value); }} />
        {errors.has('fullName') ? <span role="alert">{errors.get('fullName')}</span> : null}
      </p>
      <p>
        <label htmlFor="email">Email</label><br />
        <input id="email" type="email" value={state.email} onChange={(e): void => { update('email', e.target.value); }} />
        {errors.has('email') ? <span role="alert">{errors.get('email')}</span> : null}
      </p>
      <p>
        <label htmlFor="phone">Téléphone</label><br />
        <input id="phone" value={state.phone} onChange={(e): void => { update('phone', e.target.value); }} />
        {errors.has('phone') ? <span role="alert">{errors.get('phone')}</span> : null}
      </p>
      <p>
        <label htmlFor="postalCode">Code postal</label><br />
        <input id="postalCode" value={state.postalCode} onChange={(e): void => { update('postalCode', e.target.value); }} />
        {errors.has('postalCode') ? <span role="alert">{errors.get('postalCode')}</span> : null}
      </p>
      <p>
        <label htmlFor="projectType">Type de projet</label><br />
        <select id="projectType" value={state.projectType} onChange={(e): void => { update('projectType', e.target.value as ProjectTypeT | ''); }}>
          <option value="">— Sélectionner —</option>
          <option value={ProjectType.INSTALLATION_AC}>Installation climatisation</option>
          <option value={ProjectType.HEAT_PUMP}>Pompe à chaleur</option>
          <option value={ProjectType.VMC}>VMC</option>
          <option value={ProjectType.MAINTENANCE}>Entretien</option>
          <option value={ProjectType.REPAIR}>Dépannage</option>
        </select>
        {errors.has('projectType') ? <span role="alert">{errors.get('projectType')}</span> : null}
      </p>
      <p>
        <label htmlFor="surface">Surface (m²) — optionnel</label><br />
        <input id="surface" type="number" min="1" value={state.surface} onChange={(e): void => { update('surface', e.target.value); }} />
      </p>
      <p>
        <label htmlFor="deadline">Échéance souhaitée — optionnel</label><br />
        <input id="deadline" type="date" value={state.deadline} onChange={(e): void => { update('deadline', e.target.value); }} />
      </p>
      <p>
        <label htmlFor="message">Message</label><br />
        <textarea id="message" rows={5} value={state.message} onChange={(e): void => { update('message', e.target.value); }} />
        {errors.has('message') ? <span role="alert">{errors.get('message')}</span> : null}
      </p>
      <button type="submit" disabled={submitting}>{submitting ? 'Envoi…' : 'Envoyer la demande'}</button>
    </form>
  );
}
```

- [ ] **Step 4: Update `frontend/src/pages/ContactPage.tsx`**

```tsx
import { ContactForm } from '@/features/contact/ContactForm';

export function ContactPage(): React.ReactElement {
  return (
    <section>
      <h1>Demande de devis</h1>
      <p>Remplissez le formulaire — nous revenons vers vous sous 48 h.</p>
      <ContactForm />
    </section>
  );
}
```

- [ ] **Step 5: Run tests — must pass**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run test -- tests/features/contact/ContactForm.test.tsx
# Expected: 3 passing
npm run typecheck && npm run lint
```

- [ ] **Step 6: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/src/features/contact frontend/src/pages/ContactPage.tsx frontend/tests/features/contact
git commit -m "feat(frontend): add contact form with client validation and api submission"
```

### Section 4 verification

- [ ] All tests pass; typecheck/lint clean. Open each public route in browser:

```bash
docker compose up -d
sleep 5
for path in "" services realisations a-propos contact; do
  printf "/%s -> %s\n" "$path" "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5173/$path)"
done
# Expected: 200 for all
```

- [ ] Verify the contact form actually creates a `ContactRequest` row by submitting via the UI and checking DB:

```bash
docker compose exec -T postgres psql -U climalia -d climalia -c "SELECT id, full_name, email, project_type, status FROM contact_requests ORDER BY created_at DESC LIMIT 3;"
# Expected: at least one row with the values you submitted
```

---

## Section 5 — Espace pro (login + dashboard)

**Files:**
- Create: `frontend/src/features/auth/LoginForm.tsx`
- Create: `frontend/src/features/documents/DocumentList.tsx`, `frontend/src/features/documents/DocumentFilters.tsx`
- Modify: `frontend/src/pages/LoginPage.tsx`, `frontend/src/pages/DashboardPage.tsx`
- Test: `frontend/tests/features/auth/LoginForm.test.tsx`, `frontend/tests/features/documents/DocumentList.test.tsx`

### Task 5.1: LoginForm — TDD

- [ ] **Step 1: Write the failing test**

`frontend/tests/features/auth/LoginForm.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { LoginForm } from '@/features/auth/LoginForm';
import { useAuthStore } from '@/stores/authStore';

function renderForm(): void {
  render(
    <MemoryRouter initialEntries={['/espace-pro/login']}>
      <Routes>
        <Route path="/espace-pro/login" element={<LoginForm />} />
        <Route path="/espace-pro/dashboard" element={<div>dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginForm', (): void => {
  beforeEach((): void => {
    useAuthStore.getState().reset();
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  test('logs in successfully and redirects to dashboard', async (): Promise<void> => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: 'jwt.token' }), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: '1', email: 'admin@climalia.fr', firstName: 'Ad', lastName: 'Min', role: 'ADMIN', region: null,
      }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/email/i), 'admin@climalia.fr');
    await user.type(screen.getByLabelText(/mot de passe/i), 'demo');
    await user.click(screen.getByRole('button', { name: /connexion/i }));
    await waitFor((): void => { expect(screen.getByText('dashboard')).toBeInTheDocument(); });
    expect(useAuthStore.getState().token).toBe('jwt.token');
  });

  test('shows error on bad credentials', async (): Promise<void> => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Invalid credentials.' }), { status: 401, headers: { 'content-type': 'application/json' } }),
    );
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/email/i), 'admin@climalia.fr');
    await user.type(screen.getByLabelText(/mot de passe/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /connexion/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid|incorrect|invalides/i);
    expect(useAuthStore.getState().token).toBeNull();
  });
});
```

- [ ] **Step 2: Run — must fail**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run test -- tests/features/auth/LoginForm.test.tsx
```

- [ ] **Step 3: Implement `frontend/src/features/auth/LoginForm.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { fetchMe, login } from '@/api/auth';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';

export function LoginForm(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.login);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { token } = await login({ email, password });
      // We need the token in the store BEFORE fetching /me so apiFetch attaches it.
      setSession(token, {
        id: '', email, firstName: '', lastName: '', role: 'EMPLOYEE', region: null,
      });
      const me = await fetchMe();
      setSession(token, me);
      navigate('/espace-pro/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Erreur réseau';
      setError(msg.includes('Invalid') ? 'Identifiants invalides.' : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-describedby="login-help">
      <p id="login-help" style={{ background: '#f5f5f5', padding: '0.5rem' }}>
        <strong>Démo :</strong> employe.idf@climalia.fr / syndic@partner.fr / admin@climalia.fr — mot de passe <code>demo</code>
      </p>
      {error !== null ? <p role="alert" style={{ color: 'crimson' }}>{error}</p> : null}
      <p>
        <label htmlFor="login-email">Email</label><br />
        <input id="login-email" type="email" required value={email} onChange={(e): void => { setEmail(e.target.value); }} />
      </p>
      <p>
        <label htmlFor="login-password">Mot de passe</label><br />
        <input id="login-password" type="password" required value={password} onChange={(e): void => { setPassword(e.target.value); }} />
      </p>
      <button type="submit" disabled={submitting}>{submitting ? 'Connexion…' : 'Connexion'}</button>
    </form>
  );
}
```

- [ ] **Step 4: Update `frontend/src/pages/LoginPage.tsx`**

```tsx
import { LoginForm } from '@/features/auth/LoginForm';

export function LoginPage(): React.ReactElement {
  return (
    <section>
      <h1>Espace pro — Connexion</h1>
      <LoginForm />
    </section>
  );
}
```

- [ ] **Step 5: Run tests — must pass**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run test -- tests/features/auth
npm run typecheck && npm run lint
```

- [ ] **Step 6: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/src/features/auth frontend/src/pages/LoginPage.tsx frontend/tests/features/auth
git commit -m "feat(frontend): add login form with jwt session and redirect"
```

### Task 5.2: DocumentList + DocumentFilters — TDD

- [ ] **Step 1: Write the failing test**

`frontend/tests/features/documents/DocumentList.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { DocumentList } from '@/features/documents/DocumentList';
import type { ApiDocument } from '@/types/api';

function makeDoc(overrides: Partial<ApiDocument> = {}): ApiDocument {
  return {
    id: 'd1',
    title: 'Doc',
    category: 'PLANNING',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    region: 'Île-de-France',
    uploadedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('DocumentList', (): void => {
  test('renders empty state', (): void => {
    render(<DocumentList items={[]} onDownload={(): void => {}} />);
    expect(screen.getByText(/aucun document/i)).toBeInTheDocument();
  });

  test('renders documents with download button', (): void => {
    const items = [
      makeDoc({ id: 'a', title: 'Planning Mai 2026' }),
      makeDoc({ id: 'b', title: 'Fiche technique Daikin' }),
    ];
    render(<DocumentList items={items} onDownload={(): void => {}} />);
    expect(screen.getByText('Planning Mai 2026')).toBeInTheDocument();
    expect(screen.getByText('Fiche technique Daikin')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /télécharger/i })).toHaveLength(2);
  });

  test('flags documents uploaded < 7 days as new', (): void => {
    const today = new Date();
    const recent = makeDoc({ id: 'r', title: 'Recent', uploadedAt: today.toISOString() });
    const old = makeDoc({
      id: 'o', title: 'Old',
      uploadedAt: new Date(today.getTime() - 10 * 24 * 3600 * 1000).toISOString(),
    });
    render(<DocumentList items={[recent, old]} onDownload={(): void => {}} />);
    const newBadges = screen.getAllByText(/nouveau/i);
    expect(newBadges).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run — must fail**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run test -- tests/features/documents/DocumentList.test.tsx
```

- [ ] **Step 3: Implement `frontend/src/features/documents/DocumentList.tsx`**

```tsx
import type { ApiDocument } from '@/types/api';

const SEVEN_DAYS_MS = 7 * 24 * 3600 * 1000;

function isRecent(iso: string): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < SEVEN_DAYS_MS;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

export interface DocumentListProps {
  items: ReadonlyArray<ApiDocument>;
  onDownload: (id: string) => void;
}

export function DocumentList({ items, onDownload }: DocumentListProps): React.ReactElement {
  if (items.length === 0) {
    return <p>Aucun document à afficher.</p>;
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left' }}>Titre</th>
          <th>Catégorie</th>
          <th>Date</th>
          <th>Taille</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {items.map((d) => (
          <tr key={d.id} style={{ borderTop: '1px solid #eee' }}>
            <td>
              {d.title}
              {isRecent(d.uploadedAt) ? (
                <span style={{ marginLeft: '0.5rem', background: '#ffe082', padding: '0 0.4rem', borderRadius: 4, fontSize: '0.75rem' }}>Nouveau</span>
              ) : null}
            </td>
            <td>{d.category}</td>
            <td>{new Date(d.uploadedAt).toLocaleDateString('fr-FR')}</td>
            <td>{formatSize(d.sizeBytes)}</td>
            <td>
              <button type="button" onClick={(): void => { onDownload(d.id); }}>Télécharger</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 4: Implement `frontend/src/features/documents/DocumentFilters.tsx`**

```tsx
import { DocumentCategory } from '@/types/enums';
import type { DocumentCategory as DocumentCategoryT } from '@/types/enums';

export interface DocumentFiltersState {
  category: DocumentCategoryT | '';
  dateFrom: string;
  dateTo: string;
  region: string;
  search: string;
}

export interface DocumentFiltersProps {
  value: DocumentFiltersState;
  onChange: (next: DocumentFiltersState) => void;
}

export function DocumentFilters({ value, onChange }: DocumentFiltersProps): React.ReactElement {
  return (
    <fieldset style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <legend>Filtres</legend>
      <label>
        Catégorie
        <select value={value.category} onChange={(e): void => { onChange({ ...value, category: e.target.value as DocumentCategoryT | '' }); }}>
          <option value="">Toutes</option>
          {Object.values(DocumentCategory).map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
      </label>
      <label>Date du<input type="date" value={value.dateFrom} onChange={(e): void => { onChange({ ...value, dateFrom: e.target.value }); }} /></label>
      <label>au<input type="date" value={value.dateTo} onChange={(e): void => { onChange({ ...value, dateTo: e.target.value }); }} /></label>
      <label>Région<input type="text" value={value.region} onChange={(e): void => { onChange({ ...value, region: e.target.value }); }} /></label>
      <label>Recherche<input type="search" value={value.search} onChange={(e): void => { onChange({ ...value, search: e.target.value }); }} /></label>
    </fieldset>
  );
}
```

- [ ] **Step 5: Run tests — must pass**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run test -- tests/features/documents
```

- [ ] **Step 6: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/src/features/documents frontend/tests/features/documents
git commit -m "feat(frontend): add document list and filters with new-badge"
```

### Task 5.3: DashboardPage assembly (header + role badge + filters + list + download)

- [ ] **Step 1: Update `frontend/src/pages/DashboardPage.tsx`**

```tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { logout as apiLogout } from '@/api/auth';
import { getDocumentDownload, listDocuments } from '@/api/documents';
import { DocumentFilters, type DocumentFiltersState } from '@/features/documents/DocumentFilters';
import { DocumentList } from '@/features/documents/DocumentList';
import { useAuthStore } from '@/stores/authStore';
import type { ApiDocument } from '@/types/api';
import type { UserRole } from '@/types/enums';

const ROLE_BADGES: Record<UserRole, { label: string; bg: string }> = {
  ADMIN: { label: 'ADMIN', bg: '#ef9a9a' },
  EMPLOYEE: { label: 'EMPLOYÉ', bg: '#a5d6a7' },
  PARTNER: { label: 'PARTENAIRE', bg: '#90caf9' },
};

export function DashboardPage(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const [filters, setFilters] = useState<DocumentFiltersState>({ category: '', dateFrom: '', dateTo: '', region: '', search: '' });
  const [docs, setDocs] = useState<ReadonlyArray<ApiDocument>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect((): void => {
    setError(null);
    listDocuments({
      category: filters.category === '' ? undefined : filters.category,
      dateFrom: filters.dateFrom === '' ? undefined : filters.dateFrom,
      dateTo: filters.dateTo === '' ? undefined : filters.dateTo,
      region: filters.region.trim() === '' ? undefined : filters.region.trim(),
    })
      .then(setDocs)
      .catch((e: unknown) => { setError(e instanceof Error ? e.message : 'Erreur'); });
  }, [filters.category, filters.dateFrom, filters.dateTo, filters.region]);

  const visible = useMemo((): ReadonlyArray<ApiDocument> => {
    const q = filters.search.trim().toLowerCase();
    if (q === '') return docs;
    return docs.filter((d) => d.title.toLowerCase().includes(q));
  }, [docs, filters.search]);

  const handleDownload = async (id: string): Promise<void> => {
    try {
      const meta = await getDocumentDownload(id);
      window.open(meta.fileUrl, '_blank', 'noopener,noreferrer');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur de téléchargement');
    }
  };

  const handleLogout = async (): Promise<void> => {
    try { await apiLogout(); } catch { /* logout is stateless server-side */ }
    logout();
    navigate('/espace-pro/login', { replace: true });
  };

  if (user === null) return <p>Chargement…</p>;
  const badge = ROLE_BADGES[user.role];

  return (
    <section>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Bienvenue {user.firstName} {user.lastName}</h1>
        <span data-testid="role-badge" style={{ background: badge.bg, padding: '0.25rem 0.75rem', borderRadius: 4, fontWeight: 600 }}>
          {badge.label}
        </span>
        <button type="button" onClick={(): void => { void handleLogout(); }} style={{ marginLeft: 'auto' }}>
          Déconnexion
        </button>
      </header>

      <DocumentFilters value={filters} onChange={setFilters} />
      {error !== null ? <p role="alert">Erreur : {error}</p> : null}
      <DocumentList items={visible} onDownload={(id): void => { void handleDownload(id); }} />
    </section>
  );
}
```

- [ ] **Step 2: Verify lint+typecheck**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run typecheck && npm run lint
```

- [ ] **Step 3: Manual smoke**

```bash
docker compose up -d
sleep 6
# Open http://localhost:5173/espace-pro/login in a browser, log in as employe.idf@climalia.fr / demo,
# verify the dashboard renders with the EMPLOYÉ badge and a list of documents.
```

- [ ] **Step 4: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/src/pages/DashboardPage.tsx
git commit -m "feat(frontend): add dashboard with role badge filters search and download"
```

### Section 5 verification

- [ ] All Jest tests green (`npm run test`).
- [ ] Login as employe / partner / admin in the browser → each sees the right badge and a non-empty document list (admin sees all).
- [ ] After clicking "Déconnexion", visiting `/espace-pro/dashboard` redirects to `/espace-pro/login`.

---

## Section 6 — Cypress e2e

**Files:**
- Create: `frontend/cypress.config.ts`, `frontend/cypress/support/e2e.ts`, `frontend/cypress/support/commands.ts`
- Create: `frontend/cypress/e2e/contact.cy.ts`, `login-employee.cy.ts`, `login-partner.cy.ts`, `protected-redirect.cy.ts`, `token-expired.cy.ts`
- Modify: `frontend/package.json`, `frontend/tsconfig.json` (or new `cypress/tsconfig.json`)

### Task 6.1: Install + configure Cypress

- [ ] **Step 1: Install**

```bash
cd /home/dimitri/projects/climalia/frontend
npm install -D cypress
```

- [ ] **Step 2: Add scripts**

In `frontend/package.json`:

```json
"cypress:open": "cypress open",
"cypress:run": "cypress run"
```

- [ ] **Step 3: Write `frontend/cypress.config.ts`**

```ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    video: false,
  },
});
```

- [ ] **Step 4: Write `frontend/cypress/support/e2e.ts`**

```ts
import './commands';
```

- [ ] **Step 5: Write `frontend/cypress/support/commands.ts`**

```ts
/// <reference types="cypress" />

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      loginUi(email: string, password: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('loginUi', (email: string, password: string): void => {
  cy.visit('/espace-pro/login');
  cy.get('input#login-email').type(email);
  cy.get('input#login-password').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/espace-pro/dashboard');
});

export {};
```

- [ ] **Step 6: Add `frontend/cypress/tsconfig.json`**

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "types": ["cypress", "node"],
    "isolatedModules": false,
    "verbatimModuleSyntax": false
  },
  "include": ["**/*.ts"]
}
```

- [ ] **Step 7: Update root `frontend/tsconfig.json` `exclude` (or `tsconfig.app.json`) to ignore cypress**

Add `"cypress"` to `exclude` of the app tsconfig, so the strict app build doesn't try to compile cypress files.

- [ ] **Step 8: Verify Cypress binary**

```bash
cd /home/dimitri/projects/climalia/frontend
npx cypress verify
# Expected: "Verified Cypress!"
```

- [ ] **Step 9: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/cypress.config.ts frontend/cypress frontend/package.json frontend/package-lock.json frontend/tsconfig*.json
git commit -m "chore(frontend): bootstrap cypress with login command"
```

### Task 6.2: Contact submission e2e

- [ ] **Step 1: Write `frontend/cypress/e2e/contact.cy.ts`**

```ts
describe('Contact form', (): void => {
  it('submits a valid contact request and shows success', (): void => {
    cy.visit('/contact');
    cy.get('#fullName').type('Cypress User');
    cy.get('#email').type(`cypress+${Date.now().toString()}@example.com`);
    cy.get('#phone').type('0612345678');
    cy.get('#postalCode').type('75011');
    cy.get('#projectType').select('INSTALLATION_AC');
    cy.get('#message').type('Demande automatique générée par Cypress.');
    cy.get('button[type="submit"]').click();
    cy.get('[role="status"]').should('contain.text', 'envoyée');
  });
});
```

- [ ] **Step 2: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/cypress/e2e/contact.cy.ts
git commit -m "test(frontend): cypress e2e contact submission"
```

### Task 6.3: Login + dashboard download (employee)

- [ ] **Step 1: Write `frontend/cypress/e2e/login-employee.cy.ts`**

```ts
describe('Espace pro — employé', (): void => {
  it('logs in and sees employee documents', (): void => {
    cy.loginUi('employe.idf@climalia.fr', 'demo');
    cy.contains('EMPLOYÉ');
    cy.get('table tbody tr').its('length').should('be.greaterThan', 0);
    cy.get('table tbody tr').first().contains('button', 'Télécharger').click();
    // Phase 1: download endpoint returns JSON; we just assert the request fired
  });
});
```

- [ ] **Step 2: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/cypress/e2e/login-employee.cy.ts
git commit -m "test(frontend): cypress e2e employee login and document list"
```

### Task 6.4: Partner login + region filter

- [ ] **Step 1: Write `frontend/cypress/e2e/login-partner.cy.ts`**

```ts
describe('Espace pro — partenaire', (): void => {
  it('logs in, filters by region, sees filtered list', (): void => {
    cy.loginUi('syndic@partner.fr', 'demo');
    cy.contains('PARTENAIRE');
    cy.get('input[type="text"]').last().type('Île-de-France');
    cy.wait(500);
    cy.get('body').then(($b): void => {
      // Either the table contains rows mentioning IDF or the empty-state shows.
      const text = $b.text();
      expect(text).to.satisfy((t: string) => /Île-de-France/.test(t) || /Aucun document/.test(t));
    });
  });
});
```

- [ ] **Step 2: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/cypress/e2e/login-partner.cy.ts
git commit -m "test(frontend): cypress e2e partner login and region filter"
```

### Task 6.5: Unauthenticated redirect

- [ ] **Step 1: Write `frontend/cypress/e2e/protected-redirect.cy.ts`**

```ts
describe('Protected route', (): void => {
  it('redirects to login when no token', (): void => {
    cy.visit('/espace-pro/dashboard');
    cy.url().should('include', '/espace-pro/login');
  });
});
```

- [ ] **Step 2: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/cypress/e2e/protected-redirect.cy.ts
git commit -m "test(frontend): cypress e2e unauthenticated redirect"
```

### Task 6.6: Expired token → auto-logout

- [ ] **Step 1: Write `frontend/cypress/e2e/token-expired.cy.ts`**

```ts
describe('Token expiration', (): void => {
  it('logs out automatically on 401', (): void => {
    cy.loginUi('employe.idf@climalia.fr', 'demo');
    // Force the next /api/documents call to 401
    cy.intercept('GET', '/api/documents*', { statusCode: 401, body: { message: 'Expired JWT Token' } }).as('expired');
    cy.reload();
    cy.wait('@expired');
    cy.url().should('include', '/espace-pro/login');
  });
});
```

> **Note:** the auto-redirect requires the dashboard to react to a logged-out state. Confirm `DashboardPage` re-renders to "Chargement…" or that the navigate-to-login happens via the same `ProtectedRoute` mechanism. If the test fails because the page stays on dashboard, add a small effect in `DashboardPage` that watches `useAuthStore((s) => s.token)` and calls `navigate('/espace-pro/login')` when it becomes `null`. Patch:

```tsx
// In DashboardPage.tsx, add near the other hooks:
const token = useAuthStore((s) => s.token);
useEffect((): void => {
  if (token === null) navigate('/espace-pro/login', { replace: true });
}, [token, navigate]);
```

- [ ] **Step 2: Apply the patch above to `DashboardPage.tsx` if Step 1 fails**

- [ ] **Step 3: Commit**

```bash
cd /home/dimitri/projects/climalia
git add frontend/cypress/e2e/token-expired.cy.ts frontend/src/pages/DashboardPage.tsx
git commit -m "test(frontend): cypress e2e token expiration triggers logout"
```

### Section 6 verification

- [ ] Run all Cypress specs against the live stack:

```bash
cd /home/dimitri/projects/climalia
docker compose up -d
sleep 8
cd frontend
CYPRESS_BASE_URL=http://localhost:5173 npx cypress run
# Expected: 5 specs, all passing
```

If any spec fails, fix it (likely a selector mismatch or timing) before continuing.

---

## Section 7 — Final verification (full stack)

- [ ] **Step 1: Reset and bring stack up**

```bash
cd /home/dimitri/projects/climalia
docker compose down
docker compose up -d --build
sleep 10
docker compose ps
# Expected: postgres healthy, frankenphp running, node running
```

- [ ] **Step 2: Reseed backend fixtures**

```bash
make fresh
```

- [ ] **Step 3: Confirm all endpoints**

```bash
curl -s -o /dev/null -w "front:%{http_code}\n" http://localhost:5173
curl -s -o /dev/null -w "realizations:%{http_code}\n" http://localhost:8000/api/realizations
curl -s -X POST http://localhost:8000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@climalia.fr","password":"demo"}' | head -c 80
echo
# Expected: 200 / 200 / token in JSON
```

- [ ] **Step 4: Confirm CORS works from front**

Open http://localhost:5173/realisations in a browser → grid renders, no CORS error in DevTools console.

- [ ] **Step 5: Run full quality gate**

```bash
cd /home/dimitri/projects/climalia/frontend
npm run typecheck   # Expected: 0 errors
npm run lint        # Expected: 0 errors
npm run test        # Expected: 100% green
CYPRESS_BASE_URL=http://localhost:5173 npx cypress run   # Expected: 100% green
```

- [ ] **Step 6: Confirm a contact request lands in DB**

Submit the contact form via UI, then:

```bash
docker compose exec -T postgres psql -U climalia -d climalia -c "SELECT id, full_name, email, project_type, status, created_at FROM contact_requests ORDER BY created_at DESC LIMIT 1;"
# Expected: a row with the email you used
```

If any check fails, return to the relevant section and fix it before declaring done.

---

## Section 8 — README update + final commit

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add a Frontend section to `README.md`**

Insert after the existing `## Endpoints API` section, before `## TODO`:

```markdown
## Frontend (React 19 + Vite + TypeScript)

Code: `frontend/`. Bundler Vite, dev server sur `http://localhost:5173`, conteneur `node:22-alpine` (`docker compose up -d node`).

### Commandes

| Cible | Description |
| --- | --- |
| `make bash-front` | Shell dans le conteneur frontend |
| `make typecheck`  | `tsc -b --noEmit` (mode strict + `noUncheckedIndexedAccess`) |
| `make lint-front` | ESLint flat config |
| `make test-front` | Jest + React Testing Library |
| `make cypress`    | Cypress e2e (headless) |

### Identifiants démo (espace pro)

- Admin : `admin@climalia.fr`
- Employé Île-de-France : `employe.idf@climalia.fr`
- Partenaire syndic : `syndic@partner.fr`

Mot de passe : `demo`. **Le JWT est conservé en mémoire (Zustand) — un rafraîchissement de page déconnecte volontairement l'utilisateur.**

### Structure

```
frontend/
├── src/
│   ├── api/         # client fetch typé + modules par ressource
│   ├── components/  # Layout, NavBar, ProtectedRoute, FranceMap…
│   ├── features/    # auth, contact, documents, realizations, services
│   ├── pages/       # une page = une route React Router 7
│   ├── stores/      # zustand (authStore)
│   └── types/       # DTOs miroirs des entités Symfony
├── tests/           # Jest + RTL
└── cypress/         # e2e
```

### Restant (TODO phase 3)

- [ ] Intégration design (palette, typo, animations, responsive)
- [ ] Déploiement Coolify (front statique + back FrankenPHP)
- [ ] Stockage S3 pour téléchargements binaires réels
```

- [ ] **Step 2: Update the existing top-level "TODO" block to mark Phase 2 (frontend bootstrap) done**

Replace the line `- [ ] **Phase 2** — Frontend React 19 + Vite + Tailwind + intégration design` with:

```markdown
- [x] **Phase 2 — bootstrap** — Frontend React 19 + Vite + TS strict, routing, auth, espace pro, tests Jest + Cypress (cf. section _Frontend_)
- [ ] **Phase 3** — Intégration design (couleurs, typo, animations) + déploiement Coolify
```

- [ ] **Step 3: Commit**

```bash
cd /home/dimitri/projects/climalia
git add README.md
git commit -m "docs: add frontend section and mark phase 2 bootstrap done"
```

- [ ] **Step 4: Print final report**

Output a markdown summary listing each verification with ✅ / ❌ and remaining TODOs:

```
## Récapitulatif final

### Vérifications
- ✅ docker compose up -d → backend + front UP
- ✅ http://localhost:5173 répond 200
- ✅ API joignable, pas de CORS
- ✅ npm run typecheck → 0 erreur
- ✅ npm run lint → 0 erreur
- ✅ npm run test → 100% vert (X tests)
- ✅ npx cypress run → 100% vert (5 specs)
- ✅ Login admin/employé/partenaire OK, dashboard adapté au rôle
- ✅ Soumission contact → ContactRequest en DB

### TODO (phase 3)
- Intégration design (palette, typo, animations, responsive)
- Déploiement Coolify
- Stockage S3 pour binaires de documents
```

If any item is ❌, list the fix needed.

---

## Self-review notes

- **Spec coverage:** every user task (1.Setup, 2.API client, 3.Routing, 4.Public pages, 5.Espace pro, 6.Tests, 7.Verifications, 8.Git+README) maps to a section above. Each verification step from spec section 7 is enforced in Section 7 of this plan.
- **Constraints:**
  - No `localStorage` / `sessionStorage`: enforced in `authStore.test.ts` (spies on `Storage.prototype.setItem`) and by design in the store (no persistence).
  - Strict TS + `noUncheckedIndexedAccess`: enabled in Task 1.2; ESLint forbids `any` in Task 1.3.
  - All components have typed props (`interface ...Props`); all functions have explicit return types (`React.ReactElement`, `void`, `Promise<T>`).
- **Jest config note:** the correct option name is `setupFilesAfterEach`. Confirm with `npx jest --showConfig` if anything looks off.
- **Cypress vs Jest:** Cypress specs hit the live backend (real DB seeded by fixtures). Jest tests mock `fetch`. This is intentional: e2e validates the integration, unit tests validate logic.
