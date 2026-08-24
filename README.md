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


# Trackora Backend

Enterprise backend for Trackora — a multi-tenant delivery management
platform. Companies (tenants) register a workspace; everything in the
system is scoped to a tenant.

Verified end-to-end against a real PostgreSQL 16 instance: migrations
applied, seed data loaded, and every flow below (auth, RBAC, tenant
isolation, refresh rotation) exercised with real HTTP requests during
development. See "What was actually tested" at the bottom.

## Stack

- **Runtime**: Node.js 20+, TypeScript, Express 5
- **Database**: PostgreSQL, via **Drizzle ORM** (`drizzle-orm` + `pg`)
- **Auth**: JWT (access + refresh), bcrypt password hashing
- **Validation**: Zod, at the HTTP boundary (middleware) and for env config
- **Logging**: pino (structured JSON in production, pretty-printed in dev)

### Why Drizzle instead of Prisma

Prisma's CLI (`generate`/`validate`/`migrate`) requires downloading
engine binaries from `binaries.prisma.sh` at install/build time. In
network-restricted environments (CI runners with an egress allowlist,
some corporate networks, this project's own build sandbox) that
download fails and blocks the entire toolchain. Drizzle has no
binary-engine dependency — `drizzle-kit generate` is pure Node/TS and
produces plain `.sql` migration files you can read, review, and run
anywhere `psql` runs. If your environment doesn't have this
restriction, Prisma is a perfectly reasonable alternative; nothing
about the architecture below depends on the ORM choice.

## Folder structure

```
src/
  config/
    env.ts               # Zod-validated environment config; fails fast on boot
  db/
    schema/               # One file per table group + enums + relations
    migrations/            # Generated SQL migrations (drizzle-kit generate)
    client.ts              # pg Pool + drizzle instance
    migrate.ts              # Programmatic migration runner (npm run db:migrate)
    seed.ts                  # Development seed data
    tenant-scope.ts           # withTenant() — the tenant-isolation helper every repository uses
  lib/
    jwt.ts             # Access/refresh token signing & verification
    crypto.ts           # Password hashing, OTP/token generation, API key generation
    permissions.ts        # RBAC permission matrix (role -> permissions)
    api-error.ts            # Typed error hierarchy
    async-handler.ts          # Wraps async route handlers for error forwarding
    pagination.ts               # Shared pagination query schema + response shaping
    logger.ts                     # pino instance
  middleware/
    authenticate.ts       # Verifies JWT access token -> req.auth
    authenticate-api-key.ts # Alternate auth path for programmatic API access
    authorize.ts             # requirePermission(...) / requireOwner
    validate.ts                # Zod request validation (body/query/params)
    rate-limit.ts                 # General + auth-specific rate limiters
    request-id.ts                   # Correlation ID for logs
    error-handler.ts                  # Central error -> HTTP response mapping
  services/
    audit-log.service.ts   # Single write path for the append-only audit trail
  modules/
    auth/                 # register, login, verify-email (OTP), refresh, logout, forgot/reset password
    tenants/                # workspace availability check, org settings, plan
    users/                    # invite lifecycle, role management
    drivers/                    # fleet: drivers
    vehicles/                     # fleet: vehicles
    shipments/                      # core domain entity + status state machine
    routes/                           # delivery routes + stop sequencing
    webhooks/                           # tenant-configured webhook endpoints
    api-keys/                             # programmatic API key issuance/revocation
    audit-logs/                             # read-only audit trail
    analytics/                                # dashboard aggregate queries
  app.ts             # Express app assembly (middleware stack + route mounting)
  server.ts            # Entry point, graceful shutdown
```

Each CRUD module follows the same four-file shape:

- **`*.validation.ts`** — Zod schemas for request bodies/queries/params
- **`*.repository.ts`** — data access only. Every query goes through
  `withTenant()`; no business logic lives here
- **`*.service.ts`** — business logic, invariants, audit logging.
  Calls repositories, never touches Drizzle directly
- **`*.controller.ts`** — thin HTTP layer: parse `req`, call the
  service, shape the response. No business logic
- **`*.routes.ts`** — wires `validate()` + `authenticate` +
  `requirePermission()` + the controller onto Express routes

Webhooks, API keys, and audit-logs are small enough that their
repository/service/controller live in one `*.module.ts` file each —
same layering, less ceremony for three thin CRUD surfaces.

## Authentication

JWT access + refresh, matching the frontend's login/register/verify/
forgot-reset flows exactly:

- **Access token**: 15 min TTL (configurable), carries `{ sub: userId,
  tenantId, role }`. Stateless — every downstream check reads from the
  verified token, no DB round-trip per request just to know a role.
- **Refresh token**: 30 day TTL (configurable), delivered as an
  `httpOnly`, `sameSite=lax` cookie scoped to `/api/v1/auth`. Stored
  **hashed** (SHA-256) in `refresh_tokens`, never in plaintext.
- **Rotation on every use**: calling `/auth/refresh` issues a new
  refresh token and revokes the one just used, linking them via
  `replacedByTokenId`.
- **Reuse detection**: if an already-revoked refresh token is
  presented again — the signature of a stolen/replayed token — every
  refresh token for that user is immediately revoked and the caller
  must log in again. Verified in testing: reusing an old token after
  rotation returns 401 and invalidates the newly-rotated token too.
- **Email verification**: 6-digit OTP, 10 min TTL, hashed at rest, max
  5 attempts before requiring a resend.
- **Password reset**: high-entropy opaque token (not the OTP path),
  30 min TTL, hashed at rest. `forgotPassword` always returns success
  regardless of whether the account exists — never leaks account
  existence.
- **Workspace-scoped login**: email is unique **per tenant**, not
  globally (`users_tenant_email_unique`) — matching the frontend's
  "find your workspace, then log in" flow. The same email can be an
  owner at one company and a viewer at another.
- **API keys** (`authenticate-api-key.ts`): alternate bearer-token auth
  for server-to-server integration, resolved per-request against
  `api_keys.keyHash`. Treated as `dispatcher`-equivalent access.

## RBAC

Permission-based, not a bare role hierarchy — `lib/permissions.ts` is
the single source of truth:

| Role | Summary |
|---|---|
| `owner` | Full access, including tenant settings, billing, and the only role that can be assigned/removed as the last owner |
| `admin` | Same operational access as owner, minus the "last owner" protections |
| `dispatcher` | Manages drivers, vehicles, shipments, routes; reads users and analytics; no user/billing/webhook management |
| `driver` | Reads shipments/routes; can update the **status only** of shipments assigned to them (`shipments:update_own`, enforced in the service layer, not just the route) |
| `viewer` | Read-only everywhere |

`requirePermission(...permissions)` middleware checks the JWT's role
against this matrix. For the one case that isn't a clean role check —
a driver updating their own shipment's status — the route accepts
either `shipments:manage` or `shipments:update_own`, and the **service
layer** verifies the shipment is actually assigned to the calling
driver before allowing the transition. Verified in testing: a `viewer`
gets a 403 with the specific missing permission named, on a route a
`viewer` shouldn't reach.

## Tenant isolation

**Application-enforced row isolation**, not Postgres Row-Level
Security. Every tenant-scoped table has a `tenant_id` column, and
every repository function *requires* a `tenantId` argument that gets
ANDed into the query via `db/tenant-scope.ts`'s `withTenant()` helper.
There is no repository method that queries a tenant-scoped table
without one.

This is enforced by **convention + TypeScript signatures + code
review** — not by a database feature. Verified in testing: a second
tenant's user (a) sees an empty list where the first tenant has real
data, and (b) gets a `404` (not a `403`, which would leak that the
resource exists) when requesting another tenant's resource by ID
directly.

**For production, add Postgres Row-Level Security as defense in
depth** — the application layer should never be the *only* boundary in
a system handling real customer data. A minimal RLS policy per
tenant-scoped table looks like:

```sql
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON shipments
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

...with the API layer calling `SET app.current_tenant_id = '<tenant
id>'` at the start of each request's transaction. This wasn't wired up
here — sharing a single pooled connection across concurrent requests
`SET`s per-request within a transaction correctly, but it adds real
complexity (transaction-scoped `SET LOCAL`, connection pool
interaction) that's worth doing deliberately with your actual pooling
strategy, not bolted on generically.

## Database migrations

```bash
npm run db:generate   # Diff schema/ against migration history -> new .sql file in db/migrations
npm run db:migrate     # Apply pending migrations (drizzle-orm/node-postgres/migrator)
npm run db:push          # Push schema directly, skipping migration files (dev/prototyping only)
npm run db:studio          # Drizzle Studio — browse the database visually
npm run db:seed              # Load development seed data (one tenant, two users, a driver, shipments)
```

Migrations are plain, readable SQL — open `db/migrations/*.sql` to see
exactly what will run. Nothing is applied automatically; `db:migrate`
is a deliberate step, suitable for a deploy pipeline.

## Local development

```bash
cp .env.example .env          # fill in real JWT secrets (openssl rand -hex 32)
docker compose up -d           # starts Postgres on localhost:5432
npm install
npm run db:migrate
npm run db:seed                 # optional — creates jordan@acmelogistics.com / DevPassword!123
npm run dev
```

Server listens on `PORT` (default `4000`). `GET /health` for a
liveness check.

## API surface

All routes are under `/api/v1`. Selected examples:

```
POST   /api/v1/auth/register              Create tenant + owner (starts email verification)
POST   /api/v1/auth/verify-email            Confirm OTP, returns tokens
POST   /api/v1/auth/login                     Workspace-scoped login
POST   /api/v1/auth/refresh                     Rotate refresh token
POST   /api/v1/auth/forgot-password               Always-success password reset request
GET    /api/v1/workspaces/:slug/availability        Public — workspace slug availability

GET    /api/v1/tenants/me                Current tenant settings
PATCH  /api/v1/tenants/me/plan             Change plan/billing cycle

GET    /api/v1/users                    List (paginated), role filter
POST   /api/v1/users                      Invite a user
POST   /api/v1/users/accept-invite          Public — set password, activate

GET    /api/v1/shipments                List (paginated), status/driver filter
POST   /api/v1/shipments                  Create
PATCH  /api/v1/shipments/:id/status         State-machine-enforced transition
PUT    /api/v1/routes/:id/stops               Replace a route's ordered stop list

GET    /api/v1/analytics/overview      Dashboard KPI aggregates
GET    /api/v1/audit-logs                Read-only, paginated
```

Every list endpoint returns `{ data: { items, page, pageSize, total,
totalPages } }`. Every error returns `{ error: { code, message,
details? }, requestId }`.

## What was actually tested

Not just "compiles" — run against a real PostgreSQL 16 instance with
real HTTP requests, in this order: migrate → seed → register a second
tenant → login → list/create/update resources → status-transition
rejection and acceptance → RBAC denial (viewer → 403) → cross-tenant
isolation (empty list + 404 on direct ID access) → refresh rotation →
refresh reuse detection (chain revocation). One real bug was found and
fixed this way: Express 5 made `req.query` a getter-only property,
which broke the query-validation middleware until `validate.ts` was
updated to use `Object.defineProperty` instead of direct assignment.

Not tested here (would need a deploy target): production TLS
termination, connection pooling under real concurrent load, and the
Postgres RLS policies described above (not implemented, only
documented as the recommended next step).
