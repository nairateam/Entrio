# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Entrio is a **Visitor Management System (VMS)** — a web app that digitizes front-desk visitor sign-in/out, host notifications, blocklists, working-hours enforcement, and an immutable audit trail. The full product spec lives in [docs/PRD.md](docs/PRD.md); read it before implementing a feature, since the data model, role permissions, and user flows are defined there.

**State of the build:**
- **Frontend (`apps/web`) is substantially built out** against the PRD, but runs on **in-memory mock data** — there are no real network calls yet (see "API seam" below).
- **Backend (`apps/api`) is still a scaffold**: most NestJS modules have empty `controllers/providers/exports`, and the Prisma schema is only a `Placeholder` model. Implementing backend features means filling these stubs against the PRD.

## Monorepo layout

pnpm workspaces + Turborepo. Node >= 20, pnpm 10.

- `apps/api` — NestJS 10 backend (`@entrio/api`) — scaffold
- `apps/web` — Next.js 14 App Router frontend (`@entrio/web`) — built (mock data)
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
pnpm --filter @entrio/api prisma:studio
```

**Tests:** `pnpm test` at the root runs Turbo's `test` task, fanning out to each package's suite (today: `apps/web`). Vitest + React Testing Library (jsdom); also runnable directly via `pnpm --filter @entrio/web test` (or `test:watch`). Config: [apps/web/vitest.config.ts](apps/web/vitest.config.ts) (aliases `@/*` manually — do NOT add `vite-tsconfig-paths`, it's ESM-only and breaks the CJS-loaded config); setup: [apps/web/src/test/setup.ts](apps/web/src/test/setup.ts). Tests live next to source as `*.test.ts(x)`; import `describe/it/expect/vi` from `vitest` explicitly (no globals).

## Architecture

### Backend (`apps/api`) — scaffold
- NestJS bootstrap in [src/main.ts](apps/api/src/main.ts): global `api` prefix (all routes `/api/...`), CORS on, a global `ValidationPipe` with `whitelist + forbidNonWhitelisted + transform` (every DTO must use `class-validator` decorators), Swagger at `/docs`.
- Feature modules under `src/modules/<feature>/` (auth, users, visitors, visits, hosts, working-hours, blocklist, notifications, reports, audit), wired into [src/app.module.ts](apps/api/src/app.module.ts). Each has `dto/` + `entities/` to fill.
- **DB access** via `PrismaService` ([src/prisma/](apps/api/src/prisma/)), exported by the global `PrismaModule`. Inject it, don't instantiate PrismaClient.
- **Auth**: JWT via Passport. Role access uses `@Roles(...)` + `RolesGuard` ([src/common/](apps/api/src/common/)) against `UserRole` from `@entrio/types`. PRD §2.1 is the permission source of truth.
- `ScheduleModule` enabled for cron (overstay sweep, PRD §4.6). Integrations scaffolded but unimplemented: `integrations/{redis,s3,twilio}`, `realtime/` (Socket.IO).
- Audit logging is a hard requirement: every state-changing action must write an `audit_logs` row (PRD §7 targets 100%).

### Frontend (`apps/web`)
- App Router under `src/app/`. Route groups: `(auth)/login` and `(dashboard)/{security,host,admin}` sharing [(dashboard)/layout.tsx](apps/web/src/app/(dashboard)/layout.tsx) (sidebar + mobile drawer + topbar). Root layout ([src/app/layout.tsx](apps/web/src/app/layout.tsx)) wraps everything in `ThemeProvider` + `QueryProvider`, mounts `AuthInitializer` + `Toaster`, and runs an anti-flash theme script.
- **Server state** via TanStack Query; **client state** via Zustand (`src/stores/` for cross-cutting, per-feature stores otherwise); **forms** via react-hook-form + Zod (`@hookform/resolvers/zod`).
- Path alias: `@/*` → `src/*`.

#### Feature-slice anatomy (the dominant convention)
Domain code lives in `src/features/<feature>/`. Built features: `auth, check-in, live-board, hosts, blocklist, reports, audit, working-hours, overrides, users, settings, notifications`. A slice typically contains:
- `types.ts` — feature-local types (often denormalized view models, distinct from `@entrio/types`)
- `fixtures.ts` — in-memory mock data shaped like the `@entrio/types` models
- `api/<feature>-api.ts` — **the API seam** (see below)
- `store/use-<feature>-store.ts` — Zustand store orchestrating wizard/UI state and calling the api layer
- `schema.ts` — Zod schema for forms (where applicable)
- `components/` — feature components built from the shared UI kit
- `index.ts` — barrel; **pages import only from the barrel**, e.g. `import { LiveBoard } from '@/features/live-board'`

#### The API seam (how mock → real will work)
Every `api/*-api.ts` function has its **final signature and return type**, today resolving `fixtures` after a simulated `await wait()` and persisting mutations in a module-level working copy. Each body carries the exact `apiFetch<T>(...)` call it will become — swapping to the real backend is a per-function one-line change, no caller churn. All real traffic will go through the thin `apiFetch` wrapper ([src/lib/api/client.ts](apps/web/src/lib/api/client.ts), prefixes `NEXT_PUBLIC_API_URL`, default `http://localhost:4000`).

#### Shared UI & cross-cutting code
- **UI kit** in `src/components/ui/`, barrel-exported: `import { Button, Modal, Badge, toast } from '@/components/ui'`. Tailwind + `cn()` ([src/lib/utils.ts](apps/web/src/lib/utils.ts)) + CSS-variable tokens in [globals.css](apps/web/src/app/globals.css) (`darkMode: 'class'`; add variant colors there + map in [tailwind.config.ts](apps/web/tailwind.config.ts)). `Button` supports `asChild` (renders a child like `<Link>` via `Slot`). Transient feedback via `toast.success/error/info` (`<Toaster/>` mounted in root layout).
- **Shared domain UI** (used by >1 feature) goes in `src/components/shared/` (e.g. `VisitStatusBadge` + `STATUS_LABELS`); generic formatters in [src/lib/format.ts](apps/web/src/lib/format.ts) (`initials`, `last4`, `formatDate/Time/DateTime/Duration`). **Features depend downward only** (shared UI, `@/lib`, `@entrio/types`) — no feature→feature imports.

#### Auth & route guards (mock)
- The app **starts signed out**. [useAuthStore](apps/web/src/stores/auth-store.ts) holds the user; `signIn` persists a readable `entrio_session` cookie + sets the user, `signOut` clears both, `hydrate()` restores from the cookie on refresh (run by `AuthInitializer` in the root layout).
- **Route protection is in [src/middleware.ts](apps/web/src/middleware.ts)**: unauthenticated → `/login`; wrong-role → own dashboard. It uses `SESSION_COOKIE` / `canAccess` / `roleHome` from [features/auth/session-config.ts](apps/web/src/features/auth/session-config.ts), which is **edge-safe** (no DOM, no lucide imports) so it bundles into the Edge runtime — keep it that way.
- Real-auth swap: the API sets an httpOnly cookie (the middleware presence check is unchanged), delete the client cookie helpers in [features/auth/session.ts](apps/web/src/features/auth/session.ts), point `hydrate()` at `GET /api/auth/me`, and flip the `apiFetch` lines in [features/auth/api/auth-api.ts](apps/web/src/features/auth/api/auth-api.ts). Demo accounts for the mock login are in `features/auth/fixtures.ts`.

### Shared types (`packages/types`)
Enums (`UserRole`, `VisitStatus`, `NotificationType/Channel/Status`) and model types live here, imported by both apps as `@entrio/types`. Single source of truth for cross-cutting domain constants — don't redefine role/status strings in either app.

## Conventions & gotchas

- **Run `pnpm --filter @entrio/web build` before declaring frontend work done.** type-check + lint do NOT catch React Server Component serialization errors. Concretely: components that use refs or `asChild`/`Slot` (`Button`, `Slot`, `Modal`) must be `'use client'` — otherwise prerender fails with *"Refs cannot be used in Server Components."* Because the root [not-found.tsx](apps/web/src/app/not-found.tsx) boundary is part of every route's prerender, one such error fails the build for *all* pages, not just the offender.
- **All packages share `@entrio/config`'s ESLint config, referenced via `require.resolve()`** — e.g. `extends: [require.resolve('@entrio/config/eslint/next')]`. A bare `extends: '@entrio/config/eslint/next'` does NOT work (ESLint mangles it to `@entrio/eslint-config-config/...`). Keep the `require.resolve()` wrapper. `@entrio/config/package.json` has no `exports` map (it would block this); presets are plain files resolved by path. TS-ESLint plugins reach apps via pnpm's default `*eslint*` hoisting; `eslint` must stay a direct devDep of every package with a `lint` script.
- **Web dev server is hardcoded to port 3000**, API to 4000. If 3000 is occupied: `pnpm --filter @entrio/web exec next dev -p <port>`. A stale `next dev` locks `.next/` and causes `EPERM` on the next build — kill the leftover node process first.
- **pnpm 10 blocks dependency build scripts by default.** Packages needing a postinstall (native or binary builds) must be listed in root `package.json` → `pnpm.onlyBuiltDependencies` (currently includes `argon2`, `prisma`, `esbuild`, …). Symptom: an `Ignored build scripts: <pkg>` warning and the tool failing at runtime with a missing binary (this bit Vitest via `esbuild`). After adding one, run `pnpm rebuild <pkg>` since a no-op `pnpm install` won't re-run it.
- **Theme** is persisted to `localStorage['entrio-theme']`, applied pre-paint by an inline script in the root layout to avoid a flash.
- **Mock data is per-feature**, so the same person can appear across features by convention, not shared state (e.g. flagging on the live board does not yet surface in `/admin/flagged`). This converges once the API is real.
- **Prisma has a placeholder schema** — implementing real data means replacing the `Placeholder` model in [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma) with the PRD §3 tables, then `prisma:generate` + `prisma:migrate`. Required API env vars are in [apps/api/.env.example](apps/api/.env.example).
