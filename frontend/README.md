# Trackora — Company Operations Console (Frontend)

The Phase 6 frontend for Trackora: a multi-tenant delivery-management console that
gives each company an at-a-glance operations dashboard on top of the existing
Phase 1–5 backend. It is a fresh Vite + React + TypeScript app that talks to the
backend **exactly as it exists** — no backend routes, schemas, or database objects
were added or changed for this phase.

## Stack

- **Vite 5** + **React 18.3** + **TypeScript 5.6** (strict)
- **Tailwind CSS 3.4** for styling (semantic status-color design system)
- **react-router-dom 6** for routing
- **lucide-react** for icons
- No state library, data-fetching library, or UI kit — a small `useApiResource`
  hook and a hand-rolled `fetch` client keep the dependency surface minimal.

## Prerequisites

- **Node 18+** (Node 20/22 recommended)
- The **Trackora backend (Phase 5)** running locally, by default on
  `http://127.0.0.1:4000`.

## Setup

```bash
# from the frontend/ directory
npm install
cp .env.example .env.local   # optional — sensible defaults are baked in
```

The two environment variables (both optional) are documented in `.env.example`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api/v1` | Base path the API client calls. Relative by design (see below). |
| `VITE_PROXY_TARGET` | `http://127.0.0.1:4000` | Where the dev server proxies `/api` to reach the backend. |

## Run

```bash
npm run dev        # starts Vite on http://localhost:3000
```

Then open `http://localhost:3000` and sign in with a seeded backend user.

**Why port 3000 and a proxy?** The backend issues its refresh token as an
`httpOnly` cookie scoped to `/api/v1/auth`. To keep that cookie first-party
without any CORS/cookie gymnastics, the app stays on a single origin: the Vite
dev server listens on `:3000` (the origin the backend's `CORS_ORIGIN` allows) and
proxies every `/api` request to the backend on `:4000`. The access token is held
**in memory only** and sent as a `Bearer` header; it is never written to
`localStorage`.

## Troubleshooting

### "Can't reach the server" / `ECONNREFUSED` on `/api/v1/auth/refresh`

This is expected when the **backend isn't running**. The frontend proxies every
`/api` request to the Trackora backend; if nothing is listening there, the proxy
reports `ECONNREFUSED` and the app shows a "Can't reach the server" screen (its
correct graceful state). Start the backend, then click **Retry**:

```bash
# in the Trackora backend project (separate from this frontend)
# 1. Make sure PostgreSQL is running and DATABASE_URL in the backend .env points to it
npm install
npm run db:migrate     # apply schema
npm run db:seed        # optional: seed a demo workspace + user
npm run dev            # starts the API on port 4000
```

Seeded demo login (from the backend seed): workspace `acme-logistics`, email
`jordan@acmelogistics.com`, password `DevPassword!123`.

The dev proxy points at `http://127.0.0.1:4000` by default. **Use `127.0.0.1`, not
`localhost`** — on Windows with Node 18+, `localhost` resolves to IPv6 (`::1`)
first and the proxy can log noisy `AggregateError [ECONNREFUSED] …
internalConnectMultiple` errors even when the backend is up on IPv4. If your
backend runs elsewhere, set `VITE_PROXY_TARGET` in `.env.local` accordingly. When
the backend is unreachable the proxy now logs a single concise hint and returns a
clean `502` rather than flooding the console.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on `:3000` with the `/api` proxy. |
| `npm run build` | Type-checks (`tsc`) then produces a production build. |
| `npm run preview` | Serves the production build on `:3000`. |
| `npm run typecheck` | `tsc --noEmit` — full strict type-check, no build. |
| `npm run lint` | ESLint across the project. |

### Offline static checks

Because this environment has no outbound network (so `npm install` / `tsc` /
`vite build` can't run here), two dependency-free Node analyzers under `scripts/`
approximate the most likely build-breakers and can be run with plain Node:

```bash
node scripts/check-imports.mjs   # every import resolves to a real export; only allowed deps used
node scripts/check-unused.mjs    # no unused imports (proxy for noUnusedLocals)
```

These are a safety net for review, **not** a replacement for `tsc`/ESLint — run
the real toolchain once dependencies are installed.

## How it's organized

```
src/
  main.tsx              App entry (BrowserRouter + StrictMode)
  App.tsx               Routes: /login, protected shell, dashboard, placeholders, settings
  index.css             Tailwind layers + design tokens
  config/navigation.ts  Sidebar model (label, route, required permissions, planned flag)
  context/              AuthProvider + auth-context (session, permissions, refresh)
  routes/               ProtectedRoute (auth gate) + RequirePermission (RBAC gate)
  hooks/useApiResource  Generic fetch-with-AbortController hook (loading/error/data/reload)
  services/             One module per backend domain; all go through api-client.ts
  types/api.ts          TypeScript mirror of the backend DTOs/enums
  lib/                  status→tone map, permissions, formatters, error normalizer, cn()
  components/
    layout/             DashboardLayout, Sidebar, Header
    ui/                 Primitives: Button, Card, Table, Badge, Avatar, TextField, states…
    dashboard/          The eight operational widgets
  pages/                DashboardPage, SettingsPage, LoginPage, PlaceholderPage
```

### Auth & session

`AuthProvider` bootstraps the session from `GET /auth/me`, keeps the access token
in memory, and transparently retries once through `POST /auth/refresh` on a 401.
`ProtectedRoute` redirects unauthenticated users to `/login`; `RequirePermission`
guards routes that need a specific permission.

### RBAC (UX mirror only)

The sidebar and routes gate on permissions using a **client-side mirror** of the
backend's role→permission map (`src/lib/permissions.ts`). This is for UX only —
it hides links and pages a role can't use. The backend remains the sole
authority: every request is still authorized server-side, and tenant isolation is
enforced there (the `tenantId` always comes from the JWT, never from the client).

### What's live vs. planned

Two destinations are fully live against the backend today:

- **Dashboard** — KPIs and status distribution from `GET /analytics/overview`,
  recent shipments and active deliveries from `GET /shipments`, driver roster from
  `GET /drivers`, and an activity feed from `GET /audit-logs`.
- **Settings** — workspace profile editing via `PATCH /tenants/me` (gated on
  `tenant:manage`), plus read-only plan/billing and account cards.

The other sidebar items (Orders, Drivers, Customers, Deliveries, Live Tracking,
Analytics, Team) render **honest placeholders**. Where a feature has no backend
support yet (e.g. Customers has no entity; Live Tracking needs GPS data the
backend doesn't emit), the placeholder says so plainly rather than showing
fabricated data. These become real pages in later phases.

## Design principles held throughout

- **No invented backend.** Every endpoint, permission, and status value used here
  exists in the Phase 5 backend and was verified against it.
- **No fabricated data.** No mock KPIs, no fake GPS, no hardcoded company details.
  Missing capabilities are surfaced as placeholders, not faked.
- **Backend is the source of truth** for authorization and tenant isolation; the
  frontend never trusts a client-supplied company/tenant id.
- **Strict typing.** `strict`, `noUnusedLocals`, `noUnusedParameters`, and friends
  are on; there is no use of `any` in the codebase.
