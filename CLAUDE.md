# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Entrio is a **Visitor Management System (VMS)** — a web app that digitizes front-desk visitor sign-in/out, host notifications, blocklists, working-hours enforcement, and an immutable audit trail. The full product spec is **PRD v1.1**, [docs/PRD.md](docs/PRD.md); read it before implementing a feature, since the data model, role permissions, and user flows are defined there.

**v1.1 key facts** (an earlier v1.0 differed): exactly **three roles — `security` / `host` / `admin`** (the old `supervisor` + `super_admin` were removed; their powers consolidated into `admin`), and **no QR badge** (the old `visits.badge_code` / scanning were removed).

**v2 direction — self-service check-in** ([docs/PRD2.md](docs/PRD2.md)): visitors check *themselves* in/out at a shared device; Security becomes an exception-handler. Implemented:
- **Device auth** — a `devices` table + `DeviceAuthGuard` (reads `X-Device-Token`, SHA-256-hashed token at rest). Admin-only CRUD at `/api/devices` (token shown **once** at creation). A device is a non-human principal scoped to the self-service endpoints only.
- **Self-service API** (`/api/self-service/*`, device-token only — [modules/self-service](apps/api/src/modules/self-service)): consent policy, disambiguation `visitors/search` + `hosts/search` (block/flag state stripped), `visits/by-code/:code`, `check-in`, `checkout/*`, `check-out`. The silent gates were extracted to `VisitsService.evaluateEntryGates`; a failed gate records a `denied` visit and fires a `self_service_exception` notification (real reason) to all active Security/Admin while the visitor only sees a neutral redirect.
- **Entry code** — PRD2 wrongly claims `badge_code` still exists; it was dropped in v1.1, so v2 **re-added** it as `Visit.entryCode` (unique, `ENT-XXXXXX`, minted at pre-registration and at walk-in self check-in for later self-checkout). Consent capture lives in `Visit.consentAcceptedAt` / `consentVersion`.
- **Entry UI (the visitor-facing app, at the site root)** — unauthenticated route group `src/app/(entry)/*` serving **`/` (home), `/setup`, `/check-in`, `/check-out`, `/deliveries`** (this is the homepage — the old `/kiosk/*` paths and the placeholder root `page.tsx` were removed), feature slice [features/entry](apps/web/src/features/entry) using an `entryFetch` (device-token header, not the JWT cookie). Token paired once via `/setup`. The middleware only gates `/security`, `/host`, `/admin`, `/login`, so the entry routes are public by default. Admin **Devices** page + Host pre-register surface the entry code.
- **Snapshot model (no visitor registry for walk-ins)** — per product decision, a self-service **walk-in is a self-contained visit log entry with NO Visitor record**. `Visit.visitorId` is **nullable**; walk-in details are denormalized onto the visit (`visitorName`, `visitorPhone`, `visitorEmail`, `photoUrl`, `signatureUrl`). All read mappers fall back `v.visitor?.x ?? v.visitorName` (board, hosts, notifications, reports, self-service search). Pre-registration (host-initiated) still creates a Visitor. **Blocklist/host-restriction gates only apply when there's a persistent visitor** (pre-reg); walk-ins run the working-hours gate only — blocklist/flag for walk-ins is deferred. Flagging is hidden in the board UI when `visitorId` is null.
- **Premium entry flow** — check-in is: type → (pre-reg code | walk-in info form: name/phone/email + host search + purpose) → **live photo capture with retake** ([photo-capture.tsx](apps/web/src/features/entry/components/photo-capture.tsx), `getUserMedia` + face guide) → **ground rules/policy** then an **Agree & Sign modal** with a realtime canvas **signature pad** ([signature-pad.tsx](apps/web/src/features/entry/components/signature-pad.tsx)) → submit. Photo + signature are base64 → Cloudinary (`uploadHeadshot`/`uploadSignature`), with a **data-URL fallback** stored inline when Cloudinary isn't configured (dev). This supersedes PRD2 §6.4's "tap-to-agree, no signature" decision (the product now wants a drawn signature).

**State of the build:**
- **Backend (`apps/api`)** is **complete** and running on Postgres: **all** feature modules are implemented — auth, users, visitors, visits, working-hours, overrides, hosts, blocklist, notifications, reports — plus a global **audit** service. DB is migrated + seeded.
- **Frontend (`apps/web`)** is built out against the PRD and **wired to the live API** — every `api/*-api.ts` seam now calls `apiFetch` (no mock data path in the running app). Cross-origin cookie auth works in dev.
- **Data layer was refactored to "React Query for server state, Zustand for client state only"** — all read-mostly features (live-board, notifications, audit, overrides, reports, blocklist, users, hosts, working-hours) now fetch via per-feature query hooks and mutate via `useMutation` + `invalidateQueries`. See "Data layer" below.
- **Remaining frontend work:** the **check-in** wizard is the last feature still holding its data calls in Zustand (its multi-step state stays in Zustand by design; the visitor-search / submit calls are the candidates to move to mutations).

## Monorepo layout

pnpm workspaces + Turborepo. Node >= 20, pnpm 10.

- `apps/api` — NestJS 10 backend (`@entrio/api`) — fully implemented on Postgres
- `apps/web` — Next.js 14 App Router frontend (`@entrio/web`) — built and wired to the live API
- `packages/types` — `@entrio/types`: shared enums + model types, framework-agnostic, consumed by both apps
- `packages/config` — `@entrio/config`: shared `tsconfig/*` and `eslint/*` presets (not published; referenced via `workspace:*`)

## Commands

Run from the repo root (Turbo fans out across workspaces):

```bash
pnpm dev          # run all apps in watch mode
pnpm build        # build all (respects ^build dependency order)
pnpm lint         # lint all
pnpm type-check   # tsc --noEmit across all
pnpm clean        # remove build artifacts
```

Target a single workspace with `--filter`:

```bash
pnpm --filter @entrio/web dev          # Next.js dev on http://localhost:3000
pnpm --filter @entrio/api dev          # Nest watch mode; API on http://localhost:4000, Swagger at /docs
pnpm --filter @entrio/web build        # ALWAYS run before declaring web work done (see RSC gotcha)
pnpm --filter @entrio/web type-check
```

Prisma (from `apps/api`, or `--filter @entrio/api`):

```bash
pnpm --filter @entrio/api prisma:generate   # regenerate client (after schema changes)
pnpm --filter @entrio/api prisma:migrate    # create + apply a dev migration
pnpm --filter @entrio/api prisma:seed       # demo users + working hours + sample data
pnpm --filter @entrio/api prisma:studio
```

The DB is migrated (`apps/api/prisma/migrations/`) and seeded. Demo logins (password `password`): `admin@entrio.dev`, `security@entrio.dev`, `host@entrio.dev`. **Destructive migrations** (dropping a column, removing enum values) make `prisma migrate dev` refuse in this non-interactive shell — hand-author the `migration.sql` (the SQL Prisma would emit) under a new timestamped folder and apply with `prisma migrate deploy`.

**Tests:** `pnpm test` at the root runs Turbo's `test` task, fanning out to each package's suite (today: `apps/web`). Vitest + React Testing Library (jsdom); also runnable directly via `pnpm --filter @entrio/web test` (or `test:watch`). Config: [apps/web/vitest.config.ts](apps/web/vitest.config.ts) (aliases `@/*` manually — do NOT add `vite-tsconfig-paths`, it's ESM-only and breaks the CJS-loaded config); setup: [apps/web/src/test/setup.ts](apps/web/src/test/setup.ts). Tests live next to source as `*.test.ts(x)`; import `describe/it/expect/vi` from `vitest` explicitly (no globals).

## Architecture

### Backend (`apps/api`)
- NestJS bootstrap in [src/main.ts](apps/api/src/main.ts): global `api` prefix (all routes `/api/...`), CORS (`credentials: true`), `cookie-parser`, a global `ValidationPipe` with `whitelist + forbidNonWhitelisted + transform` (every DTO must use `class-validator` decorators), Swagger at `/docs`.
- Feature modules under `src/modules/<feature>/` (auth, users, visitors, visits, hosts, working-hours, overrides, blocklist, notifications, reports, audit, departments), wired into [src/app.module.ts](apps/api/src/app.module.ts). All are implemented.
- **DB access** via `PrismaService` ([src/prisma/](apps/api/src/prisma/)), exported by the global `PrismaModule`. Inject it, don't instantiate PrismaClient. The schema implements the full PRD §3 data model.
- **Auth**: cookie-based JWT via Passport + argon2. Login sets an httpOnly `access_token` cookie; `JwtStrategy` reads it (bearer fallback). Role access uses `@Roles(...)` + `RolesGuard` ([src/common/](apps/api/src/common/)) against `UserRole` from `@entrio/types`; PRD §2.1 is the permission source of truth. Prisma's generated `UserRole` and the `@entrio/types` enum are distinct nominal types — bridge at the boundary with [`toUserRole`](apps/api/src/common/mappers/role.mapper.ts), don't cast.
- **Audit is a hard requirement** (PRD §7 = 100% coverage): every state-changing action calls the global `AuditService.log(...)` ([modules/audit](apps/api/src/modules/audit/)). Follow this in every new mutation.
- **API contracts mirror the web "API seam"** (see Frontend) — service methods return the denormalized shapes the frontend already expects, so wiring is a per-call swap.
- **Integrations** under `src/integrations/`: `cloudinary/` (visitor headshot uploads — server-side, set as `visitor.photoUrl` on check-in) and `web-push/` (VAPID Web Push for host arrival alerts) are **implemented**; both are config-gated and degrade gracefully if their env vars are absent. `redis/` + `realtime/` (Socket.IO) remain scaffolds. The old `s3/` and `twilio/` scaffolds were removed (Cloudinary and Web Push replaced them).
- **Notifications**: arrival check-in writes an in-app bell row (`channel: in_app`) and, when `settings.pushNotifications` is on, sends a Web Push to the host. Hosts can reply to a visit (`POST /api/hosts/me/visits/:id/respond`) which notifies the front desk (the `checkedInById` security user, else all active security) via a `host_response` notification + push. `NotificationChannel` is `push | email | in_app` (the `sms` value was renamed to `push`).
- **Config-as-data**: system settings ([modules/settings](apps/api/src/modules/settings)) are still in-memory (reset on restart); the admin-managed **department** pick-list ([modules/departments](apps/api/src/modules/departments)) is persisted (table `departments`) and drives the department dropdowns (invite-user, reports filter).
- `ScheduleModule` enabled for cron (overstay sweep, PRD §4.6).
- **Body limit**: [main.ts](apps/api/src/main.ts) raises the JSON body limit to 5 MB (base64 headshots) — the default 100 KB is too small; it disables Nest's default body parser and re-adds `express.json`/`urlencoded` (so `express` is a direct dependency).

### Frontend (`apps/web`)
- App Router under `src/app/`. Route groups: `(auth)/login` and `(dashboard)/{security,host,admin}` sharing [(dashboard)/layout.tsx](apps/web/src/app/(dashboard)/layout.tsx) (sidebar + mobile drawer + topbar). Root layout ([src/app/layout.tsx](apps/web/src/app/layout.tsx)) wraps everything in `ThemeProvider` + `QueryProvider`, mounts `AuthInitializer` + `Toaster`, and runs an anti-flash theme script.
- **Server state** via TanStack Query (per-feature `hooks/use-<feature>.ts`); **client state** via Zustand (`src/stores/` for cross-cutting auth/toast; per-feature *UI-only* stores where state is shared across sibling components); **forms** via react-hook-form + Zod (`@hookform/resolvers/zod`). See "Data layer" below for the split.
- Path alias: `@/*` → `src/*`.

#### Feature-slice anatomy (the dominant convention)
Domain code lives in `src/features/<feature>/`. Built features: `auth, check-in, live-board, hosts, blocklist, reports, audit, working-hours, overrides, users, settings, notifications`. A slice typically contains:
- `types.ts` — feature-local types (often denormalized view models, distinct from `@entrio/types`)
- `api/<feature>-api.ts` — **the API seam** (see below)
- `hooks/use-<feature>.ts` — React Query hooks (queries + mutations) wrapping the api layer; the default home for server-state reads/writes
- `store/use-<feature>-*-store.ts` — Zustand store for **client/UI state only** (wizard steps, shared modal/filter state). Most features no longer have one
- `schema.ts` — Zod schema for forms (where applicable)
- `components/` — feature components built from the shared UI kit
- `index.ts` — barrel; **pages import only from the barrel**, e.g. `import { LiveBoard } from '@/features/live-board'`

#### The API seam
Every `api/*-api.ts` function is a thin `apiFetch<T>(...)` call returning the feature's view type. All traffic goes through the `apiFetch` wrapper ([src/lib/api/client.ts](apps/web/src/lib/api/client.ts) — prefixes `NEXT_PUBLIC_API_URL` default `http://localhost:4000`, sends `credentials: 'include'` for the httpOnly JWT cookie, throws `ApiError(status, message)`, handles 204). The NestJS API was deliberately shaped to these contracts, so responses already match each feature's view types. **Components never call the api layer directly — they go through the feature's query hooks** (the one exception is the auth store, which calls `auth-api` directly). Some `fixtures.ts` files still exist but are no longer on the running path.

#### Data layer (React Query + Zustand split)
The convention, with **live-board as the reference** ([features/live-board/hooks/use-live-board.ts](apps/web/src/features/live-board/hooks/use-live-board.ts)):
- **Reads = `useQuery`** in `hooks/use-<feature>.ts`, exported through the barrel (`useTodayVisits`, `useNotifications`, `useUsers`, …). Query keys live next to the hooks (e.g. `visitsKeys`, `userKeys`). Live/inbox views poll via `refetchInterval` (board 20s, notifications 30s); filtered lists put the filters **in the query key** so changing them refetches (`useAuditLog(filters)`, `useReport(filters)`).
- **Writes = `useMutation`** that `invalidateQueries` the affected keys on success (e.g. blocklist block/unblock invalidates *both* the blocked and flagged lists). Per-row pending UI uses `mutation.isPending && mutation.variables === id` rather than a hand-tracked `actingId`.
- **Client state = Zustand or local `useState`.** Single-component UI state (a modal's open flag, a search box, an editable draft) is plain `useState`. UI state **shared across sibling components** keeps a slim store: `useReportsFiltersStore` (filters bar ↔ dashboard), `useBlocklistUiStore` + `useLiveBoardUiStore` (lists ↔ confirm modal). Cross-cutting stores in `src/stores/`: `useAuthStore`, toast.
- **QueryClient defaults** ([providers/query-provider.tsx](apps/web/src/providers/query-provider.tsx)): `staleTime: 30s`, `refetchOnWindowFocus: true`, `retry: 1`.
- **Still on the old pattern: `check-in`** — its wizard state is correctly in Zustand, but the data calls (visitor search, submit) haven't been moved to mutations yet.
- **Known contract deltas already handled at the seam:** check-in passes an approved `overrideRequestId` (not `isOverride`); visitor FK fields are `blockedById`/`flaggedById`; me-scoped host endpoints take a `'me'` arg the server ignores.

#### Shared UI & cross-cutting code
- **UI kit** in `src/components/ui/`, barrel-exported: `import { Button, Modal, Badge, toast } from '@/components/ui'`. Tailwind + `cn()` ([src/lib/utils.ts](apps/web/src/lib/utils.ts)) + CSS-variable tokens in [globals.css](apps/web/src/app/globals.css) (`darkMode: 'class'`; add variant colors there + map in [tailwind.config.ts](apps/web/tailwind.config.ts)). `Button` supports `asChild` (renders a child like `<Link>` via `Slot`). Transient feedback via `toast.success/error/info` (`<Toaster/>` mounted in root layout).
- **Shared domain UI** (used by >1 feature) goes in `src/components/shared/` (e.g. `VisitStatusBadge` + `STATUS_LABELS`); generic formatters in [src/lib/format.ts](apps/web/src/lib/format.ts) (`initials`, `last4`, `formatDate/Time/DateTime/Duration`). **Features depend downward only** (shared UI, `@/lib`, `@entrio/types`) — no feature→feature imports.

#### Auth & route guards (live)
- The app **starts signed out**. [useAuthStore](apps/web/src/stores/auth-store.ts) holds the user; login (`POST /api/auth/login`) makes the API set an **httpOnly `access_token` cookie**, then `signIn(user)` records the user; `signOut()` clears it locally (call `authApi.logout()` to clear the server cookie); `hydrate()` restores the user via `GET /api/auth/me` on load/refresh (run by `AuthInitializer` in the root layout). The JWT cookie is owned by the API and never read in JS. The old client cookie helpers (`features/auth/session.ts`) were deleted.
- **Route protection is in [src/middleware.ts](apps/web/src/middleware.ts)**: unauthenticated → `/login`; wrong-role → own dashboard. It checks the cookie's presence and decodes the JWT (unverified — verification is the API's job) for role routing, using `canAccess` / `roleHome` from [features/auth/session-config.ts](apps/web/src/features/auth/session-config.ts), which is **edge-safe** (no DOM, no lucide imports) so it bundles into the Edge runtime — keep it that way.
- **Dev cross-origin cookie:** web is `localhost:3000`, API `localhost:4000`. Because `localhost` is host-only, the cookie flows to both; API CORS uses `origin: true, credentials: true`. Demo logins (password `password`): `admin@`/`security@`/`host@entrio.dev`.

### Shared types (`packages/types`)
Enums (`UserRole` = `security`/`host`/`admin`; `VisitStatus`; `NotificationType/Channel/Status`) and model types live here, imported by both apps as `@entrio/types`. Single source of truth for cross-cutting domain constants — don't redefine role/status strings in either app. Changing an enum here means updating the Prisma enum too (+ a migration).

## Conventions & gotchas

- **Run `pnpm --filter @entrio/web build` before declaring frontend work done.** type-check + lint do NOT catch React Server Component serialization errors. Concretely: components that use refs or `asChild`/`Slot` (`Button`, `Slot`, `Modal`) must be `'use client'` — otherwise prerender fails with *"Refs cannot be used in Server Components."* Because the root [not-found.tsx](apps/web/src/app/not-found.tsx) boundary is part of every route's prerender, one such error fails the build for *all* pages, not just the offender.
- **All packages share `@entrio/config`'s ESLint config, referenced via `require.resolve()`** — e.g. `extends: [require.resolve('@entrio/config/eslint/next')]`. A bare `extends: '@entrio/config/eslint/next'` does NOT work (ESLint mangles it to `@entrio/eslint-config-config/...`). Keep the `require.resolve()` wrapper. `@entrio/config/package.json` has no `exports` map (it would block this); presets are plain files resolved by path. TS-ESLint plugins reach apps via pnpm's default `*eslint*` hoisting; `eslint` must stay a direct devDep of every package with a `lint` script.
- **Web dev server is hardcoded to port 3000**, API to 4000. If 3000 is occupied: `pnpm --filter @entrio/web exec next dev -p <port>`. A stale `next dev` locks `.next/` and causes `EPERM` on the next build — kill the leftover node process first.
- **pnpm 10 blocks dependency build scripts by default.** Packages needing a postinstall (native or binary builds) must be listed in root `package.json` → `pnpm.onlyBuiltDependencies` (currently includes `argon2`, `prisma`, `esbuild`, …). Symptom: an `Ignored build scripts: <pkg>` warning and the tool failing at runtime with a missing binary (this bit Vitest via `esbuild`). After adding one, run `pnpm rebuild <pkg>` since a no-op `pnpm install` won't re-run it.
- **Theme** is persisted to `localStorage['entrio-theme']`, applied pre-paint by an inline script in the root layout to avoid a flash.
- **State now converges through the backend** (the web is wired to the live API), so an action in one feature surfaces in another — e.g. flagging on the live board shows in `/admin/flagged` after its query refetches/invalidates. Leftover `fixtures.ts` files are off the running path; don't reintroduce reads from them.
- **Prisma `migrate dev` can EPERM on Windows** when regenerating the client if a running API process holds the query-engine DLL — kill the leftover `node` (the `dist/main` or `nest` process) and re-run `prisma:generate`. For local API smoke tests, start on a spare port (`$env:PORT='4100'; pnpm --filter @entrio/api start:prod`) to dodge a dev server on 4000. Required API env vars are in [apps/api/.env.example](apps/api/.env.example).
