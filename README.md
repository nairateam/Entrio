# Entrio

A **Visitor Management System (VMS)** — digital front-desk sign‑in/out with self‑service check‑in, host notifications, blocklists, working‑hours enforcement, and an immutable audit trail.

In **v2**, visitors check **themselves** in and out at a shared entry device (tablet, laptop, or phone); Security shifts from operating check‑in to handling exceptions. The entry experience is the site homepage; staff sign in separately to role‑based dashboards.

---

## Features

- **Self‑service entry** (`/`) — pre‑registered (typed code) or walk‑in: details → live photo capture → ground‑rules + drawn signature → done. Auto‑returns to Welcome for the next visitor.
- **Self‑service check‑out** — find your name, enter your code, confirm.
- **Host pre‑registration** — hosts schedule visitors and the entry code is emailed to the visitor.
- **Security workspace** — live board / "who's inside" roll call, visitations log, and a visit‑detail drawer (photo + signature). Exception alerts when a self‑service gate fails.
- **Admin** — users, devices, blocklist, flagged visitors, working hours & blackout dates, overrides, reports/export, audit log, settings.
- **Silent safety gates** — blocklist, host restrictions, and working‑hours checks run automatically; a failed gate quietly redirects the visitor and alerts staff with the real reason.
- **Overstay handling** — periodic overstay alerts and an end‑of‑day auto‑checkout sweep.
- **Notifications** — in‑app bell + Web Push (host arrival, host replies, overstay, exceptions).
- **Audit** — every state‑changing action is logged.

Roles: **`security` · `host` · `admin`**. Full spec in [docs/PRD.md](docs/PRD.md) (v1.1) and [docs/PRD2.md](docs/PRD2.md) (v2 self‑service).

---

## Tech stack

| Area | Stack |
| --- | --- |
| Monorepo | pnpm workspaces + Turborepo |
| Backend (`apps/api`) | NestJS 10, PostgreSQL, Prisma, Passport JWT (httpOnly cookie) + argon2 |
| Frontend (`apps/web`) | Next.js 14 (App Router), TanStack Query, Zustand, react‑hook‑form + Zod, Tailwind CSS, Outfit font |
| Shared | `@entrio/types` (enums + model types), `@entrio/config` (tsconfig/eslint presets) |
| Integrations | Cloudinary (photos/signatures), Resend (email), Web Push / VAPID — all config‑gated, degrade gracefully if unset |

---

## Project structure

```
apps/
  api/      NestJS API (Prisma + Postgres) — REST under /api, Swagger at /docs
  web/      Next.js app — entry flow at the root, staff dashboards under /(dashboard)
packages/
  types/    @entrio/types — shared enums + model types
  config/   @entrio/config — shared tsconfig + eslint presets
docs/       PRD.md (v1.1), PRD2.md (v2 self-service)
```

---

## Getting started

### Prerequisites

- **Node ≥ 20**, **pnpm 10**
- A **PostgreSQL** database

### 1. Install

```bash
pnpm install
```

### 2. Configure env

Copy the example files and fill them in:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

At minimum set `DATABASE_URL` and `JWT_SECRET` in `apps/api/.env`. See [Environment variables](#environment-variables).

### 3. Database

```bash
pnpm --filter @entrio/api prisma:migrate   # apply migrations
pnpm --filter @entrio/api prisma:seed      # demo users + working hours + sample data
```

### 4. Run

```bash
pnpm dev
```

- Web → http://localhost:3000
- API → http://localhost:4000 (Swagger at http://localhost:4000/docs)

**Demo logins** (password `password`): `admin@entrio.dev` · `security@entrio.dev` · `host@entrio.dev`.

To try the entry flow, sign in as **admin → Devices**, create a device (the token is shown once), open **`/setup`** and paste it to pair the device, then use **Check in / Check out** at `/`.

---

## Commands

Run from the repo root (Turbo fans out across workspaces):

```bash
pnpm dev          # run all apps in watch mode
pnpm build        # build all (respects dependency order)
pnpm lint         # lint all
pnpm type-check   # tsc --noEmit across all
pnpm test         # run test suites
pnpm clean        # remove build artifacts
```

Target one workspace with `--filter`:

```bash
pnpm --filter @entrio/web dev
pnpm --filter @entrio/api dev
```

Prisma (from `apps/api`, or via `--filter @entrio/api`):

```bash
pnpm --filter @entrio/api prisma:generate   # regenerate client after schema changes
pnpm --filter @entrio/api prisma:migrate    # create + apply a dev migration
pnpm --filter @entrio/api prisma:seed
pnpm --filter @entrio/api prisma:studio
```

---

## Environment variables

`apps/api/.env` (canonical list in `apps/api/.env.example`):

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string **(required)** |
| `JWT_SECRET` | Auth token signing key **(required in prod)** |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `1d`) |
| `CORS_ORIGIN` | Allowed web origin for credentialed CORS |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Headshot + signature uploads (else stored inline) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web Push (generate once: `npx web-push generate-vapid-keys`) |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional email (pre‑registration codes) |
| `APP_URL` | Public web URL (used in emails) |

`apps/web` (`apps/web/.env.example`):

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | API base URL used directly in dev |
| `API_PROXY_TARGET` | **Production:** the API origin `/api` is proxied to (keeps the auth cookie first‑party). Set in the Vercel env. |

Integrations are optional in dev — without their keys, uploads/email/push are skipped and the in‑app paths still work.

---

## Architecture notes

- **Auth** — cookie‑based JWT (Passport + argon2). The web middleware gates `/security`, `/host`, `/admin`, `/login`; entry routes are public.
- **Entry device auth** — a non‑human **device** principal authenticates self‑service endpoints with a scoped `X-Device-Token` (SHA‑256 hashed at rest); it can reach nothing else. The visitor's **entry code** is the per‑visit key for check‑in/out (the server resolves the visit from it — clients never pass a visit id).
- **Data layer (web)** — server state via TanStack Query (per‑feature hooks), client/UI state via Zustand or local state, forms via react‑hook‑form + Zod. UI uses CSS‑variable design tokens (light/dark).
- **Snapshot model** — self‑service walk‑ins are self‑contained visit log entries (no persistent Visitor record); host pre‑registration still creates a Visitor.

---

## Deployment

- **Web → Vercel**, **API + Postgres → Railway** (via the GitHub integration — pushing deploys).
- In production the web proxies `/api` to the backend so the auth cookie stays first‑party — set **`API_PROXY_TARGET`** to the API origin on Vercel.
- Set the API secrets on Railway: `DATABASE_URL`, `JWT_SECRET`, `VAPID_*`, `RESEND_*`, `CLOUDINARY_*`, `CORS_ORIGIN`.
- Migrations are applied with `prisma migrate deploy`; the API's `start:prod` does not auto‑migrate.

---

## License

Private / unpublished.
