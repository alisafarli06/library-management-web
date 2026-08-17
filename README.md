# Library Management Web

React 19 SPA for the Library Management API: catalogue, loans, members, and admin account controls. TypeScript, Vite 7, React Router.

Companion API: [library-management-api](https://github.com/alisafarli06/library-management-api).

## Live Demo

| Layer | URL |
|-------|-----|
| App | [library-management-web-4tu2-woad.vercel.app](https://library-management-web-4tu2-woad.vercel.app) |
| API | [library-management-api-8wiv.onrender.com](https://library-management-api-8wiv.onrender.com) |
| API docs | [Swagger UI](https://library-management-api-8wiv.onrender.com/swagger-ui/index.html) |

The API is hosted on Render’s free tier and may take a moment to wake.

## Key Features

- Register / login; JWT access + refresh stored in `localStorage`
- Role-aware navigation: `USER` vs `ADMIN`
- Books: search, sort, paginate; users borrow for themselves; admins manage the catalogue and attach cover images / preface PDFs
- Authors: search, book counts, CRUD (admin)
- Members (admin): patron CRUD plus linked-login **role** and **block** (Make Admin / Remove Admin, Block / Unblock). Members without a login show “No login account”
- My Loans (any signed-in user) and all-loan management (admin)
- Analytics charts and ranked borrow tables (admin)
- Settings: display name and password change
- Session expiry handling and a global API error path
- Light/dark theme preference

There is no separate Users page. Account role and status belong to `User` on the API; Members is the only admin UI for them.

## Technology Stack

| Area | Choice |
|------|--------|
| UI | React 19, TypeScript (strict), Vite 7 |
| Routing | React Router 7 |
| Charts | Recharts |
| Icons | lucide-react |
| Tests | Vitest, Testing Library, jsdom |
| Deploy | Vercel (SPA rewrites; production API origin via `VITE_API_ORIGIN`) |

## Architecture

```
Vite / Vercel SPA
  pages + components
  api/*  →  fetch wrapper (Bearer token, refresh on 401)
       ↓
Spring Boot API  →  PostgreSQL
```

| Area | Location | Role |
|------|----------|------|
| Routes / guards | `src/App.tsx`, `src/routes/guards.tsx` | Guest, auth, admin-only |
| Session | `src/auth/` | JWT parse, role, `localStorage` keys |
| HTTP | `src/api/http.ts` | `/api` prefix, query strings, refresh |
| Screens | `src/pages/` | One page per main route |
| Feature UI | `src/components/{books,authors,members,loans,analytics}/` | Tables, forms, dialogs |

**Local `npm run dev`:** the browser calls `/api`, and Vite proxies that to `http://localhost:8080`. A production Render URL in `.env` is **not** used as the dev proxy target (that would send Origin `http://localhost:5173` to Render, which only allows Vercel).

**Production:** `VITE_API_ORIGIN` is the Render origin. `vite build` / Vercel may also rewrite `/api/*` to that origin (see `scripts/write-vercel-json.mjs`).

## Authentication and Authorization

1. Login/register hit `/api/auth/*` and store `accessToken` + `refreshToken`.
2. Role is read from the access JWT (`USER` or `ADMIN`), not from a separate user-info call.
3. On 401, the client tries refresh once, then clears the session.
4. Blocked accounts are rejected by the API (403); they cannot keep using an old token.

| Route | Access |
|-------|--------|
| `/login`, `/register` | Guests |
| `/dashboard`, `/books`, `/authors`, `/my-loans`, `/settings` | Signed in |
| `/members`, `/loans`, `/analytics` | `ADMIN` only |

`USER` can browse books/authors, borrow and return their own loans, and edit profile. `ADMIN` also manages catalogue, members, all loans, analytics, and linked-account role/status. An admin cannot promote, demote, or block **themselves** in the Members table.

## Installation / Setup

**Needs:** Node.js 20+, and the [API](https://github.com/alisafarli06/library-management-api) running on port 8080 (`dev` profile, PostgreSQL up).

```bash
git clone https://github.com/alisafarli06/library-management-web.git
cd library-management-web
npm install
cp .env.example .env
npm run dev
```

App: http://localhost:5173. Keep `VITE_API_ORIGIN` pointed at localhost even if you also deploy to Render.

| Command | What it does |
|---------|----------------|
| `npm run dev` | Vite on 5173, `/api` → local 8080 |
| `npm test` | Vitest (`vitest run`) |
| `npm run typecheck` | `tsc -b` |
| `npm run build` | Writes `vercel.json`, typecheck, production bundle |
| `npm run preview` | Serve the production build (port 4173; allowed by API CORS) |

## Configuration

This app reads **one** Vite variable. Copy [`.env.example`](.env.example) to `.env`. `FRONTEND_ORIGIN` belongs on **Render**, not in this repo.

### `.env` example (local)

```bash
# Origin of the Spring Boot API (no trailing slash).
# Local npm run dev always proxies /api to http://localhost:8080.
VITE_API_ORIGIN=http://localhost:8080
```

### Vercel

```bash
VITE_API_ORIGIN=https://library-management-api-8wiv.onrender.com
```

If `VITE_API_ORIGIN` is missing on Vercel, the production build script fails on purpose.

## Swagger / OpenAPI

API documentation lives in the backend (springdoc-openapi). There is no Postman collection in this repository.

| | Local (API on port 8080) | Production |
|--|--------------------------|------------|
| Swagger UI | [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html) | [https://library-management-api-8wiv.onrender.com/swagger-ui/index.html](https://library-management-api-8wiv.onrender.com/swagger-ui/index.html) |
| OpenAPI JSON | [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs) | [https://library-management-api-8wiv.onrender.com/v3/api-docs](https://library-management-api-8wiv.onrender.com/v3/api-docs) |

Start the API, open Swagger UI, call `POST /api/auth/login`, then **Authorize** with `Bearer <accessToken>`.

## Testing

```bash
npm test
npm run typecheck
npm run build
```

Page tests cover auth guards, Members role/block flows, loans, books, and analytics. They mock the API module; they do not need PostgreSQL.

Backend tests live in the API repo (`./gradlew test`) and do need local PostgreSQL.

## Deployment

1. Deploy the API on Render with `SPRING_PROFILES_ACTIVE=prod` and `FRONTEND_ORIGIN=https://library-management-web-4tu2-woad.vercel.app` (no trailing slash).
2. Deploy this app on Vercel with `VITE_API_ORIGIN` set to the Render API origin.
3. `npm run build` / `vercel-build` generates `vercel.json`: proxy `/api/:path*` to Render when `VITE_API_ORIGIN` is remote, plus SPA fallback `/(.*) → /index.html`.

Without matching CORS on Render, the browser shows `Invalid CORS request`.

## Project Structure

```
src/
├── api/                 # HTTP client + resource modules
├── auth/                # Tokens, JWT helpers, session
├── components/          # Feature UI + layout + primitives
├── pages/               # Route screens
├── routes/guards.tsx
├── theme/
├── types/
├── App.tsx
└── main.tsx
.env.example
vite.config.ts           # Dev /api proxy
scripts/write-vercel-json.mjs
```

## Demo Account

Register from `/register` (creates `USER`). Bootstrap **ADMIN** email is configured on the API (`ADMIN_EMAIL`; default in API config is `alisafarli@gmail.com`). The password is not stored in this repo.
